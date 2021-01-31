CREATE TABLE `info` (
  `db_version` int(11) DEFAULT NULL,
  `user_next_bot` int(11) DEFAULT NULL
);

CREATE TABLE `active_raids` (
 `gym_id` varchar(35) NOT NULL,
 `gym_name` text,
 `initiated_by` text,
 `guild_id` text,
 `channel_id` text,
 `area` text,
 `boss_name` text,
 `active` tinyint(1) DEFAULT '0',
 `end_time` text,
 `expire_time` text,
 `raid` text,
 `raid_channel` text,
 `created` text,
 `role_id` text,
 `updated` tinyint(1) DEFAULT '0',
 PRIMARY KEY (`gym_id`)
);

CREATE TABLE `active_areas` (
  `guild_id` text,
  `area` text,
  `category_id` text
);

CREATE TABLE `lobby_members` (
 `gym_id` varchar(35) NOT NULL,
 `user_id` varchar(50) NOT NULL,
 `count` int(11) DEFAULT '1',
 `time` varchar(5) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
 `arrived` varchar(35) DEFAULT 'interested',
 PRIMARY KEY (`gym_id`,`user_id`),
 CONSTRAINT `fk_lobby_members` FOREIGN KEY (`gym_id`) REFERENCES `active_raids` (`gym_id`) ON DELETE CASCADE
);

CREATE TABLE `users` (
 `user_id` varchar(50) NOT NULL,
 `user_name` text,
 `geofence` text,
 `pokemon` text,
 `quests` text,
 `raids` text,
 `pvp` text,
 `lure` text,
 `invasion` text,
 `status` varchar(32) DEFAULT 'ACTIVE',
 `bot` text,
 `alert_time` text,
 `discord_id` bigint(20) unsigned NOT NULL,
 `pokemon_status` varchar(32) DEFAULT 'ACTIVE',
 `raids_status` varchar(32) DEFAULT 'ACTIVE',
 `pvp_status` varchar(32) DEFAULT 'ACTIVE',
 `quests_status` varchar(32) DEFAULT 'ACTIVE',
 `lure_status` varchar(32) DEFAULT 'ACTIVE',
 `invasion_status` varchar(32) DEFAULT 'ACTIVE',
 PRIMARY KEY (`user_id`,`discord_id`)
);

CREATE TABLE `quest_alerts` (
  `user_id` text,
  `quest` text,
  `embed` longtext,
  `area` text,
  `bot` text,
  `alert_time` bigint(20) DEFAULT NULL,
  `discord_id` text,
  `user_name` text
);

INSERT INTO info(db_version, user_next_bot) VALUES(23,0)
