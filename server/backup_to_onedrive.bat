@echo off
REM ============================================================
REM  MISC App — OneDrive Backup Script
REM  Syncs server/uploads to OneDrive nightly
REM  Run manually: double-click this file
REM  Scheduled: Task Scheduler → runs at 2:00 AM daily
REM ============================================================

SET SOURCE=D:\Claude Cowork\MISC--main\MISC--main\MISC--main\MISC--main\MISC--main\server\uploads
SET DEST=onedrive_misc:MISC-App-Backups/uploads
SET LOG=D:\Claude Cowork\MISC--main\MISC--main\MISC--main\MISC--main\MISC--main\server\logs\onedrive_backup.log

echo [%DATE% %TIME%] Starting MISC OneDrive backup... >> "%LOG%"

rclone sync "%SOURCE%" "%DEST%" ^
  --progress ^
  --transfers=5 ^
  --checkers=10 ^
  --log-file="%LOG%" ^
  --log-level=INFO ^
  --stats=30s

IF %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Backup completed successfully. >> "%LOG%"
    echo Backup completed successfully!
) ELSE (
    echo [%DATE% %TIME%] Backup FAILED with error code %ERRORLEVEL%. >> "%LOG%"
    echo Backup FAILED. Check log at: %LOG%
)

pause
