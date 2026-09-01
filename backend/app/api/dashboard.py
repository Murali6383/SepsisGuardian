from fastapi import APIRouter,Depends
from app.api.dependencies import require_roles
from app.db.models import User,UserRole
r=APIRouter(prefix='/api/dashboard',tags=['Dashboards'])
@r.get('/admin')
def admin(u:User=Depends(require_roles(UserRole.ADMIN))): return {'message':f'Welcome {u.full_name}','role':u.role.name.value}
@r.get('/admission')
def admission(u:User=Depends(require_roles(UserRole.ADMIN,UserRole.ADMISSION))): return {'message':f'Welcome {u.full_name}','role':u.role.name.value}
@r.get('/nurse')
def nurse(u:User=Depends(require_roles(UserRole.ADMIN,UserRole.NURSE))): return {'message':f'Welcome {u.full_name}','role':u.role.name.value}
@r.get('/doctor')
def doctor(u:User=Depends(require_roles(UserRole.ADMIN,UserRole.DOCTOR))): return {'message':f'Welcome {u.full_name}','role':u.role.name.value}
