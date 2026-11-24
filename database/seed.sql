create extension if not exists pgcrypto;

insert into technicians (username,password_hash,full_name,is_active)
values
 ('admin',crypt('admin123',gen_salt('bf')),'Default Administrator',true),
 ('tech1',crypt('tech123',gen_salt('bf')),'Alex Technician',true)
on conflict (username) do update set password_hash=excluded.password_hash, full_name=excluded.full_name, is_active=excluded.is_active;

insert into readers (reader_id,name,location,is_active)
values ('ESP32_READER_01','Main Technician Reader','Service Desk',true)
on conflict (reader_id) do update set name=excluded.name, location=excluded.location, is_active=excluded.is_active;

with a as (select id from technicians where username='admin')
insert into devices (rfid_uid,name,device_type,model,serial_number,manufacturer,location,status,notes,created_by)
select v.rfid_uid,v.name,v.device_type,v.model,v.serial_number,v.manufacturer,v.location,v.status,v.notes,a.id
from (values
 ('B392AA56','Dell Latitude','Laptop','Latitude 5420','DL5420-001','Dell','IT Room','ACTIVE','Primary test laptop'),
 ('A1000001','Cisco Switch','Network','Catalyst 9200','CS9200-100','Cisco','Server Closet','ACTIVE','Core access switch'),
 ('C2000002','Epson Printer','Printer','EcoTank L3250','EP3250-200','Epson','Front Office','UNDER_REPAIR','Scanner intermittent'),
 ('D3000003','Motorola Radio','Radio','SL300','MR300-300','Motorola','Warehouse','ACTIVE','Warehouse radio'),
 ('E4000004','iPad Pro','Tablet','A2764','IPAD-400','Apple','Training Room','RETIRED','Decommissioned tablet')
) v(rfid_uid,name,device_type,model,serial_number,manufacturer,location,status,notes),a
on conflict (rfid_uid) do nothing;

insert into tickets (ticket_number,device_id,title,description,priority,status,assigned_to,created_by)
select t.ticket_number,d.id,t.title,t.description,t.priority,t.status,
       (select id from technicians where username=t.assignee),
       (select id from technicians where username='admin')
from (values
 ('TK-000001','A1000001','Switch uplink failure','Port 24 intermittently drops packets.','HIGH','IN_PROGRESS','tech1'),
 ('TK-000002','C2000002','Replace printer feed roller','Scanner and feed roller need service.','MEDIUM','OPEN','admin'),
 ('TK-000003','B392AA56','Battery replacement','Laptop battery discharges too quickly.','LOW','CLOSED','tech1')
) t(ticket_number,rfid,title,description,priority,status,assignee)
join devices d on d.rfid_uid=t.rfid
on conflict (ticket_number) do nothing;
