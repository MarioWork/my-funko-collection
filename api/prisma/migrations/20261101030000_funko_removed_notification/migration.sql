-- An admin force-deleted a funko other users had (issue #13): each of them is told, with the reason. The funko is
-- gone, so these notifications keep only its name (funko_id stays null).
ALTER TYPE "notification_kind" ADD VALUE 'FUNKO_REMOVED';
