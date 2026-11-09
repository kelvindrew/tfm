package cd.tfm.scheduler.engine

import cd.tfm.scheduler.model.CycleDayResult
import cd.tfm.scheduler.model.Landmark
import cd.tfm.scheduler.model.ShiftType
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * TFM Rotation Engine
 *
 * Rules:
 * - 9-day cyclic rotation.
 * - Days 1..3: Day shift (06:00 - 18:00)
 * - Days 4..6: Night shift (18:00 - 06:00)
 * - Days 7..9: Rest period (Repos)
 *
 * Reference anchor:
 * May 13, 2026 is Day 1 (Day Shift 1).
 * November 1, 2026 is also Day 1 (172 days after May 13, 2026; 172 % 9 = 1).
 *
 * Landmarks:
 * - A: Day 9 (Repos 3)
 * - B: Day 5 (Nuit 2)
 * - C: Day 9 (Repos 3)
 */
object RotationEngine {

    val REFERENCE_DATE: LocalDate = LocalDate.of(2026, 5, 13)
    const val CYCLE_LENGTH = 9

    /**
     * Calculates the cycle day (1..9) for any given date using robust floor modulo.
     */
    fun getCycleDay(targetDate: LocalDate): Int {
        val daysDiff = ChronoUnit.DAYS.between(REFERENCE_DATE, targetDate)
        val mod = Math.floorMod(daysDiff, CYCLE_LENGTH.toLong()).toInt()
        return mod + 1
    }

    /**
     * Maps cycle day (1..9) to ShiftType.
     */
    fun getShiftType(cycleDay: Int): ShiftType {
        return when (cycleDay) {
            in 1..3 -> ShiftType.DAY
            in 4..6 -> ShiftType.NIGHT
            in 7..9 -> ShiftType.REST
            else -> throw IllegalArgumentException("Cycle day must be between 1 and 9, got $cycleDay")
        }
    }

    /**
     * Determines landmark if applicable for given cycle day.
     */
    fun getLandmark(cycleDay: Int): Landmark? {
        return when (cycleDay) {
            5 -> Landmark.B
            9 -> Landmark.A // Or C depending on team assignment
            else -> null
        }
    }

    /**
     * Computes the number of days until the next shift transition and what that next shift will be.
     */
    fun getNextTransition(cycleDay: Int): Pair<Int, ShiftType> {
        return when (cycleDay) {
            in 1..3 -> Pair(4 - cycleDay, ShiftType.NIGHT)
            in 4..6 -> Pair(7 - cycleDay, ShiftType.REST)
            in 7..9 -> Pair(10 - cycleDay, ShiftType.DAY)
            else -> Pair(1, ShiftType.DAY)
        }
    }

    /**
     * Evaluates complete state for a target date.
     */
    fun evaluate(date: LocalDate, userAssignedLandmark: Landmark? = null): CycleDayResult {
        val cycleDay = getCycleDay(date)
        val shiftType = getShiftType(cycleDay)
        val (daysUntilNext, nextShift) = getNextTransition(cycleDay)

        val landmark = when {
            cycleDay == 5 -> Landmark.B
            cycleDay == 9 -> userAssignedLandmark ?: Landmark.A
            else -> null
        }

        val hours = when (shiftType) {
            ShiftType.DAY -> "06:00 — 18:00 (12h)"
            ShiftType.NIGHT -> "18:00 — 06:00 (12h)"
            ShiftType.REST -> "Repos complet"
        }

        return CycleDayResult(
            date = date,
            cycleDay = cycleDay,
            shiftType = shiftType,
            landmark = landmark,
            isWork = shiftType.isWork,
            shiftHours = hours,
            daysUntilNextTransition = daysUntilNext,
            nextShiftType = nextShift
        )
    }

    /**
     * Returns the 9-day sequence for the cycle containing the target date.
     */
    fun getFullCycle(anchorDate: LocalDate): List<CycleDayResult> {
        val currentCycleDay = getCycleDay(anchorDate)
        val cycleStartOffset = (currentCycleDay - 1).toLong()
        val cycleStartDate = anchorDate.minusDays(cycleStartOffset)

        return (0 until CYCLE_LENGTH).map { offset ->
            evaluate(cycleStartDate.plusDays(offset.toLong()))
        }
    }
}
