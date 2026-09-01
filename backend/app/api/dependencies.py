from fastapi import Depends,HTTPException,status
from fastapi.security import HTTPAuthorizationCredentials,HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.core.security import decode
from app.db.database import get_db
from app.db.models import User,UserRole
bearer=HTTPBearer(auto_error=False)
def current_user(c:HTTPAuthorizationCredentials|None=Depends(bearer),db:Session=Depends(get_db)):
    if not c: raise HTTPException(status_code=401,detail='Authentication required')
    try:
        p=decode(c.credentials)
        if p.get('type')!='access': raise ValueError()
        uid=int(p['sub'])
    except (JWTError,ValueError,KeyError): raise HTTPException(status_code=401,detail='Invalid or expired access token')
    u=db.get(User,uid)
    if not u or not u.is_active: raise HTTPException(status_code=401,detail='User unavailable')
    return u
def require_roles(*roles):
    def dep(u=Depends(current_user)):
        if u.role.name not in set(roles): raise HTTPException(status_code=403,detail='Insufficient permissions')
        return u
    return dep
