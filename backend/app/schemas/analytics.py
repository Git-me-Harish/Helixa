from datetime import datetime
from typing import Any

from pydantic import BaseModel


class VitalTrendPoint(BaseModel):
    recorded_at: datetime
    bp_systolic: int | None
    bp_diastolic: int | None
    heart_rate: int | None
    weight_kg: float | None
    glucose_mmol: float | None
    spo2_pct: float | None
    temp_celsius: float | None


class HealthScore(BaseModel):
    score: int
    grade: str
    breakdown: dict[str, Any]
    computed_at: datetime


class AIInsight(BaseModel):
    title: str
    body: str
    severity: str
    category: str


class AnalyticsInsightsResponse(BaseModel):
    insights: list[AIInsight]
    generated_at: datetime
    data_period_days: int
