# 1. Reset DB

Get-Content scripts\reset_demo_db.sql | docker exec -i clinic-mysql mysql -uroot -p123456 healthcare_db

# 2. Clear Redis (token blacklist)

docker exec -it clinic-redis redis-cli FLUSHALL

# 3. Seed lại

npm run seed:demo
