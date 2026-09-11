-- Preserve long movie and television names without changing user list-name limits.
ALTER TABLE `Title` MODIFY `name` VARCHAR(500) NOT NULL;
