CREATE DATABASE IF NOT EXISTS `iot`;
USE `iot`;

DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT 'NO_NAME',
  `modified` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`)
);

INSERT INTO `devices`(name) VALUES 
('DEVICE1'),
('DEVICE2');

DROP TABLE IF EXISTS `sensors`;
CREATE TABLE `sensors` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL DEFAULT 'NO_NAME',
  `state` varchar(45) NOT NULL DEFAULT 'ACTIVE',
  `deviceId` int(11) NOT NULL,
  `modified` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID`),
  KEY `deviceId_idx` (`deviceId`),
  CONSTRAINT `deviceIdFK` FOREIGN KEY (`deviceId`) REFERENCES `devices` (`id`) ON DELETE CASCADE
);

INSERT INTO `sensors`(name,state,deviceId) VALUES 
('SENSOR1','ACTIVE',1),
('SENSOR2','50c',1),
('SENSOR3','NORMAL',1),
('SENSOR1','DISABLED',2),
('SENSOR2','20c',2),
('SENSOR3','LOW',2);