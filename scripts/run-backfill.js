// Small runner to avoid shell quoting issues when setting DATABASE_URL
const url = 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19FSS1WejNsS0U2NUxBZzdoWDEzRUoiLCJhcGlfa2V5IjoiMDFLSjhNM1RRWlFGNlFXREhOV1I1TjlYVDMiLCJ0ZW5hbnRfaWQiOiI2Y2Y2ODlmZGI4MzkzODViYmI0ZDI1MzNlYTg3YzBjZDFkYjU4ZTNkYmI0ZjdkNDE5MzQ1Y2VjZDBjOTMyN2U0IiwiaW50ZXJuYWxfc2VjcmV0IjoiNDVmNzI2ZjItZDQ2YS00ODNjLWIyZjgtOGYyNTk3MzVhM2I5In0.1SpEzAhf5MplJvdMslBc9p93xdnkglW1AraQPQOWWZk';
process.env.DATABASE_URL = url;
console.log('DATABASE_URL set (length=' + url.length + '). Starting backfill...');
require('./backfill-cilindros-to-stock.js');
