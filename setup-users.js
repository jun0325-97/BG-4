import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykdgycklkyaxyosrgyrb.supabase.co';
const supabaseKey = 'sb_publishable_vrFEQr7977QetxKlm6-OZA_aO2BO3BZ';
const supabase = createClient(supabaseUrl, supabaseKey);

const users = [
  { id: 'hansol', name: 'Hansol' },
  { id: 'yoonhyuk', name: 'Yoonhyuk' },
  { id: 'gayoung', name: 'Gayoung' },
  { id: 'youngjun', name: 'Youngjun' }
];

async function createUsers() {
  for (const u of users) {
    const fakeEmail = `${u.id}@crew.com`;
    console.log(`Creating user: ${u.id}...`);
    const { data, error } = await supabase.auth.signUp({
      email: fakeEmail,
      password: '123456',
      options: {
        data: {
          full_name: u.name,
        }
      }
    });

    if (error) {
      console.error(`Error creating ${u.id}:`, error.message);
    } else {
      console.log(`Success: ${u.id} created!`);
    }
  }
}

createUsers();
