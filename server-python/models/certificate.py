from sqlalchemy import Column, String, UniqueConstraint
from database import Base

class Certificate(Base):
    __tablename__ = "certificates"

    certificate_id = Column(String(60), primary_key=True, index=True)
    student_id = Column(String(255), nullable=False)
    student_name = Column(String(200), nullable=False)
    event_id = Column(String(255), nullable=False)
    event_name = Column(String(300), nullable=False)
    issue_date = Column(String(100), nullable=False)
    verification_url = Column(String(500), nullable=False)
    template_style = Column(String(50), nullable=False, default="default")
    status = Column(String(50), nullable=False, default="valid")

    __table_args__ = (
        UniqueConstraint("student_id", "event_id", name="uq_student_event_certificate"),
    )
