const bcrypt = require('bcryptjs');
const password = '12345678';
bcrypt.hash(password, 10).then(hash => {
    console.log('Valid hash for 12345678:');
    console.log(hash);
});
