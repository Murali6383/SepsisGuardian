from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================================
# SYNC AI COLUMNS
# =========================================================

with engine.begin() as connection:

    connection.execute(
        text("""
            ALTER TABLE public.vital_signs
            ADD COLUMN IF NOT EXISTS map DOUBLE PRECISION
        """)
    )

    connection.execute(
        text("""
            ALTER TABLE public.vital_signs
            ADD COLUMN IF NOT EXISTS gcs DOUBLE PRECISION
        """)
    )

    connection.execute(
        text("""
            ALTER TABLE public.vital_signs
            ADD COLUMN IF NOT EXISTS vasopressor DOUBLE PRECISION
        """)
    )

    connection.execute(
        text("""
            ALTER TABLE public.vital_signs
            ADD COLUMN IF NOT EXISTS mechanical_ventilation DOUBLE PRECISION
        """)
    )

    connection.execute(
        text("""
            ALTER TABLE public.vital_signs
            ADD COLUMN IF NOT EXISTS antibiotic_given DOUBLE PRECISION
        """)
    )

    connection.execute(
        text("""
            ALTER TABLE public.vital_signs
            ADD COLUMN IF NOT EXISTS fluid_given DOUBLE PRECISION
        """)
    )

    connection.execute(
        text("""
            ALTER TABLE public.lab_results
            ADD COLUMN IF NOT EXISTS glucose DOUBLE PRECISION
        """)
    )


print("========================================")
print("AI DATABASE COLUMNS SYNCED")
print("========================================")