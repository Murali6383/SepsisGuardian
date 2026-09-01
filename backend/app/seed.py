from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.db.models import Role, User, UserRole


USERS = [
    (
        "ADM-001",
        "System Administrator",
        "admin@sepsisguardian.com",
        "Admin@12345",
        UserRole.ADMIN,
    ),
    (
        "ADMISSION-001",
        "Admission Officer",
        "admission@sepsisguardian.com",
        "Admission@12345",
        UserRole.ADMISSION,
    ),
    (
        "NURSE-001",
        "Clinical Nurse",
        "nurse@sepsisguardian.com",
        "Nurse@12345",
        UserRole.NURSE,
    ),
    (
        "DOC-001",
        "Consultant Doctor",
        "doctor@sepsisguardian.com",
        "Doctor@12345",
        UserRole.DOCTOR,
    ),
]


def seed():
    # Create database tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # -----------------------------
        # Create Roles
        # -----------------------------
        for role in UserRole:

            existing_role = (
                db.query(Role)
                .filter(Role.name == role)
                .first()
            )

            if not existing_role:
                new_role = Role(
                    name=role,
                    description=f"{role.value} access",
                )

                db.add(new_role)

        db.commit()

        # -----------------------------
        # Create / Update Users
        # -----------------------------
        for eid, name, email, password, role in USERS:

            existing_user = (
                db.query(User)
                .filter(User.email == email)
                .first()
            )

            if existing_user:
                # Update password hash for existing user
                existing_user.password_hash = hash_password(password)
                existing_user.is_active = True

            else:
                role_record = (
                    db.query(Role)
                    .filter(Role.name == role)
                    .first()
                )

                if not role_record:
                    raise Exception(
                        f"Role not found: {role}"
                    )

                user = User(
                    employee_id=eid,
                    full_name=name,
                    email=email,
                    password_hash=hash_password(password),
                    role_id=role_record.id,
                    is_active=True,
                )

                db.add(user)

        db.commit()

        print()
        print("========================================")
        print("  SepsisGuardian AI - Seed Complete")
        print("========================================")
        print()

        print("ADMIN")
        print("Email    : admin@sepsisguardian.com")
        print("Password : Admin@12345")
        print()

        print("ADMISSION")
        print("Email    : admission@sepsisguardian.com")
        print("Password : Admission@12345")
        print()

        print("NURSE")
        print("Email    : nurse@sepsisguardian.com")
        print("Password : Nurse@12345")
        print()

        print("DOCTOR")
        print("Email    : doctor@sepsisguardian.com")
        print("Password : Doctor@12345")
        print()

        print("========================================")

    except Exception as e:
        db.rollback()
        print("Seed failed:", e)
        raise

    finally:
        db.close()


if __name__ == "__main__":
    seed()