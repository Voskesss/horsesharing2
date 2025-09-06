from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, get_optional_user
from models import User

app = FastAPI(title="HorseSharing API", version="1.0.0")

# CORS middleware voor frontend communicatie
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "HorseSharing API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "horsesharing-api"}

@app.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {
        "id": current_user.id,
        "kinde_id": current_user.kinde_id,
        "email": current_user.email,
        "name": current_user.name,
        "phone": current_user.phone,
        "onboarding_completed": current_user.onboarding_completed,
        "profile_type_chosen": current_user.profile_type_chosen,
        "has_rider_profile": current_user.rider_profile is not None,
        "has_owner_profile": current_user.owner_profile is not None,
        "created_at": current_user.created_at
    }

@app.post("/auth/complete-onboarding")
async def complete_onboarding(
    profile_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark onboarding as completed and set profile type"""
    current_user.onboarding_completed = True
    current_user.profile_type_chosen = profile_type
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Onboarding completed", "profile_type": profile_type}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
