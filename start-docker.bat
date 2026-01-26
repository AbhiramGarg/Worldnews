@echo off
echo Starting WorldNews with Docker...
docker-compose up --build -d
echo.
echo Services starting up...
echo - Database: localhost:5432
echo - Application: http://localhost:3000
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
pause