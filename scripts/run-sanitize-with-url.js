// temporary runner: set DATABASE_URL then require sanitizer
process.env.DATABASE_URL = 'postgres://6cf689fdb839385bbb4d2533ea87c0cd1db58e3dbb4f7d419345cecd0c9327e4:sk_EI-Vz3lKE65LAg7hX13EJ@db.prisma.io:5432/postgres?sslmode=require&pool=true';
require('./sanitize-nfkc-and-ellipsis.js');
