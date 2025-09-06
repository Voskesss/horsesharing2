from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import User, RiderProfile
from auth import get_current_user, get_optional_user
import uvicorn

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


class ProfileTypeRequest(BaseModel):
    profile_type: str

@app.post("/auth/set-profile-type")
async def set_profile_type(
    request: ProfileTypeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set profile type choice (rider/owner)"""
    current_user.profile_type_chosen = request.profile_type
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile type set", "profile_type": request.profile_type}

@app.post("/auth/reset-profile")
async def reset_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset user profile - delete rider/owner profiles and reset onboarding"""
    # Delete rider profile if exists
    rider_profile = db.query(RiderProfile).filter(RiderProfile.user_id == current_user.id).first()
    if rider_profile:
        db.delete(rider_profile)
    
    # TODO: Delete owner profile when implemented
    # owner_profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    # if owner_profile:
    #     db.delete(owner_profile)
    
    # Reset user onboarding status
    current_user.onboarding_completed = False
    current_user.profile_type_chosen = None
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile reset successfully"}

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

# Pydantic models voor request/response
class RiderProfileCreate(BaseModel):
    # Basis informatie
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    postcode: str
    max_travel_distance_km: int = 25
    transport_options: List[str] = []
    
    # Beschikbaarheid
    available_days: List[str] = []
    available_time_blocks: List[str] = []
    session_duration_min: int = 60
    session_duration_max: int = 120
    start_date: Optional[str] = None
    arrangement_duration: str = 'ongoing'
    
    # Budget
    budget_min_euro: int
    budget_max_euro: int
    budget_type: str = 'monthly'
    
    # Ervaring
    experience_years: int
    certification_level: str
    comfort_levels: dict = {}
    
    # Doelen
    riding_goals: List[str] = []
    discipline_preferences: List[str] = []
    personality_style: List[str] = []
    
    # Taken
    willing_tasks: List[str] = []
    task_frequency: Optional[str] = None
    
    # Voorkeuren
    material_preferences: dict = {}
    health_restrictions: List[str] = []
    insurance_coverage: bool = False
    no_gos: List[str] = []
    
    # Media
    photos: List[str] = []
    video_intro_url: Optional[str] = None

@app.post("/rider-profile")
async def create_or_update_rider_profile(
    profile_data: RiderProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update rider profile"""
    
    # Check if rider profile already exists
    existing_profile = db.query(RiderProfile).filter(RiderProfile.user_id == current_user.id).first()
    
    if existing_profile:
        # Update existing profile
        for field, value in profile_data.dict().items():
            if hasattr(existing_profile, field):
                setattr(existing_profile, field, value)
        
        db.commit()
        db.refresh(existing_profile)
        return {"message": "Rider profile updated successfully", "profile_id": existing_profile.id}
    else:
        # Create new profile
        new_profile = RiderProfile(
            user_id=current_user.id,
            **profile_data.dict()
        )
        
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        
        # Mark onboarding as completed
        current_user.onboarding_completed = True
        current_user.profile_type_chosen = "rider"
        db.commit()
        
        return {"message": "Rider profile created successfully", "profile_id": new_profile.id}

@app.get("/rider-profile")
async def get_rider_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's rider profile"""
    
    profile = db.query(RiderProfile).filter(RiderProfile.user_id == current_user.id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Rider profile not found")
    
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "first_name": current_user.name.split()[0] if current_user.name else "",
        "last_name": current_user.name.split()[1] if len(current_user.name.split()) > 1 else "",
        "phone": profile.phone,
        "date_of_birth": profile.date_of_birth,
        "postcode": profile.postcode,
        "max_travel_distance_km": profile.max_travel_distance,
        "transport_options": profile.transport_options if profile.transport_options else [],
        "available_days": profile.available_days,
        "available_time_blocks": profile.available_time_blocks if profile.available_time_blocks else [],
        "session_duration_min": profile.session_duration_min if profile.session_duration_min else 60,
        "session_duration_max": profile.session_duration_max if profile.session_duration_max else 120,
        "start_date": profile.start_date,
        "arrangement_duration": profile.duration_preference,
        "budget_min_euro": profile.budget_min,
        "budget_max_euro": profile.budget_max,
        "budget_type": "monthly",  # Default for now
        "experience_years": profile.years_experience,
        "certification_level": profile.fnrs_level or profile.knhs_level or "",
        "comfort_levels": {
            "traffic": profile.comfortable_with_traffic,
            "outdoor_solo": profile.comfortable_solo_outside,
            "nervous_horses": False,  # Not in current model
            "young_horses": False,    # Not in current model
            "jumping_height": profile.max_jump_height or 0
        },
        "riding_goals": profile.goals if profile.goals else [],
        "discipline_preferences": profile.discipline_preferences if profile.discipline_preferences else [],
        "personality_style": profile.personality_style if profile.personality_style else [],
        "willing_tasks": profile.willing_tasks if profile.willing_tasks else [],
        "task_frequency": profile.task_frequency,
        "material_preferences": {
            "bitless_ok": profile.bitless_ok,
            "spurs": False,  # Not in current model
            "auxiliary_reins": profile.training_aids_ok,
            "own_helmet": True  # Default
        },
        "health_restrictions": profile.health_limitations.split(',') if profile.health_limitations else [],
        "insurance_coverage": profile.has_insurance,
        "no_gos": profile.no_gos.split(',') if profile.no_gos else [],
        "photos": profile.photos if profile.photos else [],
        "video_intro_url": profile.video_intro,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
