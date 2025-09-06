from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database URL - SQLite voor development
SQLALCHEMY_DATABASE_URL = "sqlite:///./horsesharing.db"

# Create engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Alleen nodig voor SQLite
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency voor FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
