package cd.tfm.scheduler.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "shift_notes")
data class ShiftNoteEntity(
    @PrimaryKey val dateIso: String,
    val note: String,
    val swapWithEmployeeId: String? = null,
    val isLeaveRequested: Boolean = false,
    val updatedAtTimestamp: Long = System.currentTimeMillis()
)

@Entity(tableName = "cached_announcements")
data class AnnouncementEntity(
    @PrimaryKey val id: String,
    val title: String,
    val category: String,
    val dateString: String,
    val summary: String,
    val content: String,
    val isRead: Boolean,
    val priority: String
)

@Dao
interface ShiftDao {
    @Query("SELECT * FROM shift_notes WHERE dateIso = :dateIso LIMIT 1")
    suspend fun getNoteForDate(dateIso: String): ShiftNoteEntity?

    @Query("SELECT * FROM shift_notes")
    fun getAllNotes(): Flow<List<ShiftNoteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveNote(note: ShiftNoteEntity)

    @Delete
    suspend fun deleteNote(note: ShiftNoteEntity)

    @Query("SELECT * FROM cached_announcements ORDER BY dateString DESC")
    fun getAllAnnouncements(): Flow<List<AnnouncementEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnnouncements(items: List<AnnouncementEntity>)

    @Query("UPDATE cached_announcements SET isRead = 1 WHERE id = :id")
    suspend fun markAnnouncementAsRead(id: String)
}
