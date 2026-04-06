"""
Code Editor API Router
======================
Provides AI code generation and code execution for Python, Java, C, and C++.
"""

import os
import subprocess
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.logging import get_logger
from src.services.llm import complete as llm_complete
from src.services.llm.config import get_llm_config

router = APIRouter()
logger = get_logger("CodeEditor")

# Language configuration
LANGUAGE_CONFIG = {
    "python": {
        "extension": ".py",
        "compile_cmd": None,
        "run_cmd": ["python", "{file}"],
        "display": "Python",
    },
    "java": {
        "extension": ".java",
        "compile_cmd": ["javac", "{file}"],
        "run_cmd": ["java", "-cp", "{dir}", "{classname}"],
        "display": "Java",
    },
    "c": {
        "extension": ".c",
        "compile_cmd": ["gcc", "{file}", "-o", "{output}", "-lm"],
        "run_cmd": ["{output}"],
        "display": "C",
    },
    "cpp": {
        "extension": ".cpp",
        "compile_cmd": ["g++", "{file}", "-o", "{output}", "-lm"],
        "run_cmd": ["{output}"],
        "display": "C++",
    },
}


class GenerateRequest(BaseModel):
    prompt: str
    language: str = "python"


class RunRequest(BaseModel):
    code: str
    language: str = "python"
    stdin_input: str = ""


class GenerateResponse(BaseModel):
    code: str
    language: str


class RunResponse(BaseModel):
    stdout: str
    stderr: str
    return_code: int
    error: str | None = None


@router.post("/generate", response_model=GenerateResponse)
async def generate_code(request: GenerateRequest):
    """Generate code from a natural language prompt using the configured LLM."""
    lang = request.language.lower()
    if lang not in LANGUAGE_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {lang}. Supported: {list(LANGUAGE_CONFIG.keys())}",
        )

    lang_display = LANGUAGE_CONFIG[lang]["display"]

    system_prompt = (
        f"You are an expert {lang_display} programmer. "
        f"Generate clean, well-commented {lang_display} code based on the user's request. "
        f"Return ONLY the code — no explanations, no markdown fences, no extra text. "
        f"The code must be complete and ready to compile/run."
    )

    if lang == "java":
        system_prompt += (
            "\nIMPORTANT: The public class MUST be named 'Main'. "
            "Always use 'public class Main' as the class name."
        )

    try:
        llm_config = get_llm_config()
        response = await llm_complete(
            prompt=request.prompt,
            system_prompt=system_prompt,
            model=llm_config.model,
            api_key=llm_config.api_key,
            base_url=llm_config.base_url,
            api_version=getattr(llm_config, "api_version", None),
            binding=getattr(llm_config, "binding", None),
            temperature=0.3,
        )

        # Strip markdown fences if returned
        code = response.strip()
        for fence in [f"```{lang}", "```python", "```java", "```c", "```cpp", "```c++", "```"]:
            if code.startswith(fence):
                code = code[len(fence):]
                break
        if code.endswith("```"):
            code = code[:-3]
        code = code.strip()

        logger.info(f"Generated {lang_display} code ({len(code)} chars) for prompt: {request.prompt[:60]}...")
        return GenerateResponse(code=code, language=lang)

    except Exception as e:
        logger.error(f"Code generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")


@router.post("/run", response_model=RunResponse)
async def run_code(request: RunRequest):
    """Execute code in a sandboxed subprocess with a timeout."""
    lang = request.language.lower()
    if lang not in LANGUAGE_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported language: {lang}. Supported: {list(LANGUAGE_CONFIG.keys())}",
        )

    config = LANGUAGE_CONFIG[lang]
    timeout = 15  # seconds

    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            # Determine filename
            if lang == "java":
                filename = "Main" + config["extension"]
            else:
                filename = f"code_{uuid.uuid4().hex[:8]}{config['extension']}"

            filepath = os.path.join(tmpdir, filename)
            output_path = os.path.join(tmpdir, "a.out" if os.name != "nt" else "a.exe")

            # Write source file
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(request.code)

            # Compile if needed
            if config["compile_cmd"]:
                compile_cmd = [
                    c.replace("{file}", filepath)
                     .replace("{output}", output_path)
                     .replace("{dir}", tmpdir)
                    for c in config["compile_cmd"]
                ]
                logger.debug(f"Compiling: {' '.join(compile_cmd)}")
                compile_result = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=timeout,
                    cwd=tmpdir,
                )
                if compile_result.returncode != 0:
                    return RunResponse(
                        stdout="",
                        stderr=compile_result.stderr,
                        return_code=compile_result.returncode,
                        error="Compilation failed",
                    )

            # Run
            if lang == "java":
                classname = "Main"
                run_cmd = [
                    c.replace("{file}", filepath)
                     .replace("{output}", output_path)
                     .replace("{dir}", tmpdir)
                     .replace("{classname}", classname)
                    for c in config["run_cmd"]
                ]
            else:
                run_cmd = [
                    c.replace("{file}", filepath)
                     .replace("{output}", output_path)
                     .replace("{dir}", tmpdir)
                    for c in config["run_cmd"]
                ]

            logger.debug(f"Running: {' '.join(run_cmd)}")
            run_result = subprocess.run(
                run_cmd,
                capture_output=True,
                text=True,
                timeout=timeout,
                input=request.stdin_input or None,
                cwd=tmpdir,
            )

            return RunResponse(
                stdout=run_result.stdout,
                stderr=run_result.stderr,
                return_code=run_result.returncode,
            )

    except subprocess.TimeoutExpired:
        return RunResponse(
            stdout="",
            stderr=f"Execution timed out after {timeout} seconds.",
            return_code=-1,
            error="timeout",
        )
    except FileNotFoundError as e:
        compiler_name = "gcc/g++" if lang in ("c", "cpp") else ("javac" if lang == "java" else "python")
        return RunResponse(
            stdout="",
            stderr=f"Compiler/interpreter not found: {compiler_name}. Please install it and ensure it is on your PATH.\n{str(e)}",
            return_code=-1,
            error="compiler_not_found",
        )
    except Exception as e:
        logger.error(f"Code execution failed: {e}")
        return RunResponse(
            stdout="",
            stderr=str(e),
            return_code=-1,
            error="execution_error",
        )


@router.get("/health")
async def health():
    """Health check."""
    return {"status": "healthy", "service": "codeeditor"}
