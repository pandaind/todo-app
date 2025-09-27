from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import openai
import os

router = APIRouter()

class SubtaskRequest(BaseModel):
    title: str
    description: Optional[str] = None

class SubtaskResponse(BaseModel):
    subtasks: str

@router.post(
    "/ai/subtasks",
    response_model=SubtaskResponse,
    tags=["AI Features"],
    summary="Generate subtasks using AI",
    description="Generate subtasks for a todo item using AI assistance."
)
async def generate_subtasks(
    request: SubtaskRequest,
    authorization: Optional[str] = Header(None)
):
    """Generate subtasks using AI"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="API key required")
    
    api_key = authorization.replace("Bearer ", "")
    
    try:
        # Use the provided API key for OpenAI
        client = openai.OpenAI(api_key=api_key)
        
        prompt = f"""
Task: {request.title}
{f"Description: {request.description}" if request.description else ""}

Break this task down into 3-5 specific, actionable subtasks. Format as a numbered list:
1. First subtask
2. Second subtask
etc.

Keep subtasks concise and specific.
"""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that breaks down tasks into actionable subtasks."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        subtasks = response.choices[0].message.content.strip()
        return SubtaskResponse(subtasks=subtasks)
        
    except openai.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid API key")
    except openai.RateLimitError:
        raise HTTPException(status_code=429, detail="API rate limit exceeded")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")
