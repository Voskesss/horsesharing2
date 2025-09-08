from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import requests
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
    # Basis informatie - allemaal optioneel voor tussentijds opslaan
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    postcode: Optional[str] = None
    max_travel_distance_km: Optional[int] = 25
    transport_options: List[str] = []
    
    # Beschikbaarheid
    available_days: List[str] = []
    available_time_blocks: List[str] = []
    session_duration_min: Optional[int] = 60
    session_duration_max: Optional[int] = 120
    start_date: Optional[str] = None
    arrangement_duration: Optional[str] = 'ongoing'
    
    # Budget
    budget_min_euro: Optional[int] = None
    budget_max_euro: Optional[int] = None
    budget_type: Optional[str] = 'monthly'
    
    # Ervaring
    experience_years: Optional[int] = None
    certification_level: Optional[str] = None
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

# Let only one GET endpoint exist (frontend-shaped response)

@app.post("/rider-profile")
async def create_or_update_rider_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update rider profile"""
    try:
        # Lees raw body om te zien wat er wordt verzonden
        body = await request.body()
        print(f"Raw request body: {body}")
        
        # Parse JSON manually
        import json
        raw_data = json.loads(body)
        print(f"Parsed JSON data: {raw_data}")
        
        # Probeer Pydantic model
        profile_data = RiderProfileCreate(**raw_data)
        print(f"Pydantic model created successfully: {profile_data.dict()}")
        
    except Exception as e:
        print(f"Error parsing request: {e}")
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    
    print(f"Current user: {current_user.id}, {current_user.email}")
    
    # Check if rider profile already exists
    existing_profile = db.query(RiderProfile).filter(RiderProfile.user_id == current_user.id).first()
    print(f"Existing profile found: {existing_profile is not None}")
    
    # Map Pydantic fields naar database fields
    field_mapping = {
        'first_name': None,  # Niet in database - zit in User.name
        'last_name': None,   # Niet in database - zit in User.name  
        'phone': None,       # Niet in database - zit in User.phone
        'date_of_birth': None, # Niet in database
        'postcode': 'postcode',
        'max_travel_distance_km': 'max_travel_distance',
        'transport_options': 'transport_options',
        'available_days': 'available_days',
        'available_time_blocks': None,  # Niet in database
        'session_duration_min': None,   # Niet in database
        'session_duration_max': None,   # Niet in database
        'start_date': 'start_date',
        'arrangement_duration': 'duration_preference',
        'budget_min_euro': 'budget_min',
        'budget_max_euro': 'budget_max',
        'budget_type': None,  # Niet in database
        'experience_years': 'years_experience',
        'certification_level': 'fnrs_level',
        'comfort_levels': None,  # Mapping naar meerdere boolean velden
        'riding_goals': 'goals',
        'discipline_preferences': 'discipline_preferences',
        'personality_style': 'personality_style',
        'willing_tasks': 'willing_tasks',
        'task_frequency': 'task_frequency',
        'material_preferences': None,  # Mapping naar meerdere boolean velden
        'health_restrictions': 'health_limitations',
        'insurance_coverage': 'has_insurance',
        'no_gos': 'no_gos',
        'photos': 'photos',
        'video_intro_url': 'video_intro',
    }

    if existing_profile:
        # Update existing profile met field mapping
        data = profile_data.dict()

        # Update User fields
        if data.get('first_name') or data.get('last_name'):
            name_parts = []
            if data.get('first_name'): name_parts.append(data['first_name'])
            if data.get('last_name'): name_parts.append(data['last_name'])
            if name_parts:
                new_name = ' '.join(name_parts)
                current_user.name = new_name
                # Best-effort: sync naam naar Kinde via Management API (indien M2M creds aanwezig)
                try:
                    m2m_client_id = os.getenv("KINDE_M2M_CLIENT_ID")
                    m2m_client_secret = os.getenv("KINDE_M2M_CLIENT_SECRET")
                    kinde_domain = os.getenv("KINDE_DOMAIN")
                    if m2m_client_id and m2m_client_secret and kinde_domain:
                        token_resp = requests.post(
                            f"{kinde_domain}/oauth2/token",
                            data={
                                "grant_type": "client_credentials",
                                "client_id": m2m_client_id,
                                "client_secret": m2m_client_secret,
                                # audience is optional per Kinde tenant config; omit or add if provided
                            },
                            headers={"Content-Type": "application/x-www-form-urlencoded"},
                            timeout=10,
                        )
                        if token_resp.ok:
                            access_token = token_resp.json().get("access_token")
                            # Split voor- en achternaam indien mogelijk
                            parts = new_name.strip().split(" ", 1)
                            given = parts[0] if parts else ""
                            family = parts[1] if len(parts) > 1 else ""
                            # Kinde Management API: update user profiel
                            # API pad kan per versie verschillen; we proberen generiek endpoint
                            requests.patch(
                                f"{kinde_domain}/api/v1/users/{current_user.kinde_id}",
                                json={
                                    "given_name": given,
                                    "family_name": family,
                                    "name": new_name,
                                },
                                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                                timeout=10,
                            )
                except Exception as _:
                    # Niet fatal; doorgaan met lokale update
                    pass

        if data.get('phone'):
            current_user.phone = data['phone']
            # Best-effort: sync telefoon naar Kinde (indien M2M creds aanwezig)
            try:
                m2m_client_id = os.getenv("KINDE_M2M_CLIENT_ID")
                m2m_client_secret = os.getenv("KINDE_M2M_CLIENT_SECRET")
                kinde_domain = os.getenv("KINDE_DOMAIN")
                if m2m_client_id and m2m_client_secret and kinde_domain:
                    token_resp = requests.post(
                        f"{kinde_domain}/oauth2/token",
                        data={
                            "grant_type": "client_credentials",
                            "client_id": m2m_client_id,
                            "client_secret": m2m_client_secret,
                        },
                        headers={"Content-Type": "application/x-www-form-urlencoded"},
                        timeout=10,
                    )
                    if token_resp.ok:
                        access_token = token_resp.json().get("access_token")
                        requests.patch(
                            f"{kinde_domain}/api/v1/users/{current_user.kinde_id}",
                            json={
                                "phone_number": current_user.phone,
                            },
                            headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
                            timeout=10,
                        )
            except Exception:
                pass

        # Update RiderProfile fields
        for pydantic_field, db_field in field_mapping.items():
            if db_field and pydantic_field in data:
                value = data[pydantic_field]
                print(f"Processing field {pydantic_field} -> {db_field}: {value}")
                # Partial update: alleen zetten als waarde niet None is
                if value is not None:
                    # serialize lists for TEXT columns
                    if db_field in ("health_limitations", "no_gos") and isinstance(value, list):
                        value = json.dumps(value)
                    setattr(existing_profile, db_field, value)
                print(f"Set {db_field} = {value}")
        
        # Special mappings
        comfort = data.get('comfort_levels', {})
        if comfort:
            if 'traffic' in comfort:
                existing_profile.comfortable_with_traffic = comfort['traffic']
            if 'outdoor_solo' in comfort:
                existing_profile.comfortable_solo_outside = comfort['outdoor_solo']
        
        material = data.get('material_preferences', {})
        if material:
            print(f"Processing material preferences: {material}")
            if 'bitless_ok' in material:
                existing_profile.bitless_ok = material['bitless_ok']
                print(f"Set bitless_ok = {material['bitless_ok']}")
        
        print("About to commit changes to database...")
        db.commit()
        db.refresh(existing_profile)
        print(f"Profile updated successfully with ID: {existing_profile.id}")
        return {"message": "Rider profile updated successfully", "profile_id": existing_profile.id}
    else:
        # Create new profile met minimale vereiste velden
        data = profile_data.dict()
        
        # Update User fields
        if data.get('first_name') or data.get('last_name'):
            name_parts = []
            if data.get('first_name'): name_parts.append(data['first_name'])
            if data.get('last_name'): name_parts.append(data['last_name'])
            if name_parts:
                current_user.name = ' '.join(name_parts)
        
        if data.get('phone'):
            current_user.phone = data['phone']
        
        new_profile = RiderProfile(
            user_id=current_user.id,
            postcode=data.get('postcode', ''),
            max_travel_distance=data.get('max_travel_distance_km', 25),
            transport_options=data.get('transport_options', []),
            available_days=data.get('available_days', []),
            age=25,  # Default age - should be calculated from date_of_birth
            budget_min=data.get('budget_min_euro', 0),
            budget_max=data.get('budget_max_euro', 0),
            years_experience=data.get('experience_years', 0),
            goals=data.get('riding_goals', []),
            discipline_preferences=data.get('discipline_preferences', []),
            personality_style=data.get('personality_style', []),
            willing_tasks=data.get('willing_tasks', []),
            task_frequency=data.get('task_frequency', ''),
            photos=data.get('photos', []),
            video_intro=data.get('video_intro_url', ''),
            has_insurance=data.get('insurance_coverage', False),
            no_gos=json.dumps(data.get('no_gos', [])),
            health_limitations=json.dumps(data.get('health_restrictions', []))
        )
        
        # Special mappings voor nieuwe profile
        comfort = data.get('comfort_levels', {})
        if comfort:
            new_profile.comfortable_with_traffic = comfort.get('traffic', False)
            new_profile.comfortable_solo_outside = comfort.get('outdoor_solo', False)
        
        material = data.get('material_preferences', {})
        if material:
            new_profile.bitless_ok = material.get('bitless_ok', True)
        
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
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
        "phone": current_user.phone,
        "date_of_birth": profile.date_of_birth,
        "postcode": profile.postcode,
        "max_travel_distance_km": profile.max_travel_distance,
        "transport_options": profile.transport_options if profile.transport_options else [],
        "available_days": profile.available_days if profile.available_days else [],
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
        "health_restrictions": profile.health_limitations if profile.health_limitations else [],
        "insurance_coverage": profile.has_insurance,
        "no_gos": profile.no_gos if profile.no_gos else [],
        "photos": profile.photos if profile.photos else [],
        "video_intro_url": profile.video_intro,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
