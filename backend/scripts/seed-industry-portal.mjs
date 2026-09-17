import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: 'postgresql://postgres:VedaSetu2026@localhost:5432/veda_setu' });

async function seed() {
  const hash = await bcrypt.hash('IndustryPass123!', 10);
  const user = await pool.query(`
    INSERT INTO public.users (email, password_hash, role)
    VALUES ($1, $2, 'industry')
    ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'industry'
    RETURNING id
  `, ['industry_portal@ayushindustry.org', hash]);

  const userId = user.rows[0].id;
  await pool.query(`
    INSERT INTO public.profiles (id, full_name, department, designation)
    VALUES ($1, 'Dabur India R&D', 'Ayurvedic Formulations', 'Principal Scientist')
    ON CONFLICT (id) DO UPDATE SET full_name = 'Dabur India R&D'
  `, [userId]);

  const opps = await pool.query(`SELECT id FROM public.opportunities WHERE created_by = $1`, [userId]);
  if (opps.rows.length === 0) {
    const opp = await pool.query(`
      INSERT INTO public.opportunities (created_by, title, description, opportunity_type, location, work_mode, status, application_deadline)
      VALUES ($1, 'Ayurvedic Pharmacology Fellowship', 'Clinical study on polyherbal formulation bioavailability.', 'project', 'New Delhi', 'onsite', 'published', '2026-12-31')
      RETURNING id
    `, [userId]);
    const comp = await pool.query(`SELECT id FROM public.competencies LIMIT 2`);
    if (comp.rows.length > 0) {
      await pool.query(`
        INSERT INTO public.opportunity_competencies (opportunity_id, competency_id, required_score, weight)
        VALUES ($1, $2, 75, 1)
      `, [opp.rows[0].id, comp.rows[0].id]);
    }
  }

  console.log('Seeded industry test account: industry_portal@ayushindustry.org / IndustryPass123!');
  await pool.end();
}

seed();
