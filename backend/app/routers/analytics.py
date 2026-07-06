"""Analytics router: vital trends, health score, AI insights."""

from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import desc, select

from app.core.deps import CurrentUser, DbSession
from app.models.health_record import Medication, VitalSign
from app.schemas.analytics import AIInsight, AnalyticsInsightsResponse, HealthScore, VitalTrendPoint
from app.services.ai_service import generate_health_insights

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Normal vital ranges for health score computation
VITAL_RANGES = {
    "bp_systolic": (90, 120),
    "bp_diastolic": (60, 80),
    "heart_rate": (60, 100),
    "glucose_mmol": (3.9, 7.8),
    "spo2_pct": (95.0, 100.0),
    "temp_celsius": (36.1, 37.2),
}


@router.get("/trends", response_model=list[VitalTrendPoint])
async def get_trends(
    current_user: CurrentUser,
    db: DbSession,
    days: Annotated[int, Query(ge=7, le=365)] = 30,
) -> list[VitalTrendPoint]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    result = await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == current_user.id, VitalSign.recorded_at >= since)
        .order_by(VitalSign.recorded_at)
        .limit(500)
    )
    return [VitalTrendPoint(
        recorded_at=v.recorded_at,
        bp_systolic=v.bp_systolic,
        bp_diastolic=v.bp_diastolic,
        heart_rate=v.heart_rate,
        weight_kg=v.weight_kg,
        glucose_mmol=v.glucose_mmol,
        spo2_pct=v.spo2_pct,
        temp_celsius=v.temp_celsius,
    ) for v in result.scalars().all()]


@router.get("/health-score", response_model=HealthScore)
async def get_health_score(current_user: CurrentUser, db: DbSession) -> HealthScore:
    result = await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == current_user.id)
        .order_by(desc(VitalSign.recorded_at))
        .limit(1)
    )
    vital = result.scalar_one_or_none()

    if vital is None:
        return HealthScore(
            score=0,
            grade="N/A",
            breakdown={},
            computed_at=datetime.now(timezone.utc),
        )

    breakdown = {}
    scores = []

    vital_values = {
        "bp_systolic": vital.bp_systolic,
        "bp_diastolic": vital.bp_diastolic,
        "heart_rate": vital.heart_rate,
        "glucose_mmol": vital.glucose_mmol,
        "spo2_pct": vital.spo2_pct,
        "temp_celsius": vital.temp_celsius,
    }

    for metric, value in vital_values.items():
        if value is None:
            continue
        lo, hi = VITAL_RANGES[metric]
        if lo <= value <= hi:
            s = 100
            status = "normal"
        else:
            overshoot = max(abs(value - lo), abs(value - hi)) / (hi - lo) * 100
            s = max(0, 100 - min(overshoot, 100))
            status = "high" if value > hi else "low"

        breakdown[metric] = {"value": value, "score": round(s), "status": status, "range": f"{lo}–{hi}"}
        scores.append(s)

    avg = sum(scores) / len(scores) if scores else 0
    score = round(avg)

    if score >= 90:
        grade = "A"
    elif score >= 75:
        grade = "B"
    elif score >= 60:
        grade = "C"
    elif score >= 40:
        grade = "D"
    else:
        grade = "F"

    return HealthScore(score=score, grade=grade, breakdown=breakdown, computed_at=datetime.now(timezone.utc))


@router.get("/insights", response_model=AnalyticsInsightsResponse)
async def get_insights(
    current_user: CurrentUser,
    db: DbSession,
    days: Annotated[int, Query(ge=7, le=90)] = 30,
) -> AnalyticsInsightsResponse:
    since = datetime.now(timezone.utc) - timedelta(days=days)

    vitals_result = await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == current_user.id, VitalSign.recorded_at >= since)
        .order_by(VitalSign.recorded_at)
        .limit(100)
    )
    vitals_data = [
        {
            "recorded_at": v.recorded_at.isoformat(),
            "bp_systolic": v.bp_systolic,
            "bp_diastolic": v.bp_diastolic,
            "heart_rate": v.heart_rate,
            "weight_kg": v.weight_kg,
            "glucose_mmol": v.glucose_mmol,
            "spo2_pct": v.spo2_pct,
        }
        for v in vitals_result.scalars().all()
    ]

    meds_result = await db.execute(
        select(Medication).where(Medication.patient_id == current_user.id, Medication.is_active == True).limit(10)
    )
    meds_data = [{"name": m.name, "dosage": m.dosage} for m in meds_result.scalars().all()]

    insights_raw = await generate_health_insights(vitals_data, meds_data)

    insights = [
        AIInsight(
            title=i.get("title", "Health Update"),
            body=i.get("body", ""),
            severity=i.get("severity", "info"),
            category=i.get("category", "vitals"),
        )
        for i in insights_raw
    ]

    return AnalyticsInsightsResponse(
        insights=insights,
        generated_at=datetime.now(timezone.utc),
        data_period_days=days,
    )
