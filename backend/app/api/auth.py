from datetime import datetime,timezone
from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import current_user
from app.core.security import access_token,refresh_token,verify_password
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import LoginRequest,LoginResponse
r=APIRouter(prefix='/api/auth',tags=['Authentication'])
@r.post('/login',response_model=LoginResponse)
def login(x:LoginRequest,db:Session=Depends(get_db)):
    u=db.query(User).filter(User.email==x.email.lower()).first()
    if not u or not verify_password(x.password,u.password_hash) or not u.is_active: raise HTTPException(status_code=401,detail='Invalid email or password')
    u.last_login_at=datetime.now(timezone.utc); db.commit()
    role=u.role.name.value
    return {'access_token':access_token(u.id,role),'refresh_token':refresh_token(u.id,role),'token_type':'bearer','user':{'id':u.id,'employee_id':u.employee_id,'full_name':u.full_name,'email':u.email,'role':role}}
@r.get('/me')
def me(u=Depends(current_user)): return {'id':u.id,'employee_id':u.employee_id,'full_name':u.full_name,'email':u.email,'role':u.role.name.value}
