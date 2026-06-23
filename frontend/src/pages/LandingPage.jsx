import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

const FEATURES = [
  { icon: '📋', title: 'One-tap Submission', desc: 'Submit with photo, category and a campus map pin — takes under a minute.' },
  { icon: '🔔', title: 'Live Status Updates', desc: 'Socket-powered notifications the moment your complaint status changes.' },
  { icon: '📊', title: 'Smart Analytics', desc: 'Monthly trends, priority heatmaps, and resolution rates at a glance.' },
  { icon: '🗺️', title: 'Campus Heatmap', desc: 'Snapchat-style heat blobs show where problems cluster on campus.' },
  { icon: '⚡', title: 'Priority Queue', desc: 'Emergencies are surfaced instantly so nothing critical slips through.' },
  { icon: '🔒', title: 'Role-based Access', desc: 'Students see their own complaints; admins see everything, securely.' },
];

const STEPS = [
  { n: '01', title: 'Register', desc: 'Create your student account in 30 seconds with your college email.' },
  { n: '02', title: 'Pin & Submit', desc: 'Drop a pin on the campus map, add a photo and submit.' },
  { n: '03', title: 'Track', desc: 'Watch your complaint move from Pending → In Progress → Resolved in real-time.' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma',   dept: 'Computer Science',  text: 'My WiFi complaint was resolved within 2 days! The status tracking is so satisfying.' },
  { name: 'Rahul Mehta',    dept: 'Mechanical Engg',   text: 'Finally a proper way to report hostel issues. The map picker is a game changer.' },
  { name: 'Aisha Khan',     dept: 'Civil Engineering', text: 'As a hostel warden I love the heatmap — I can see problem zones at a single glance.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 glass border-b border-slate-100/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-200">C</div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">Campus Pulse</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how"      className="hover:text-blue-600 transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link to="/login"  className="btn-secondary text-sm py-2">Login</Link>
            <Link to="/signup" className="btn-primary  text-sm py-2">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-32 px-6">
        {/* Background circles */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div {...fadeUp()}>
            <span className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-500/15 text-blue-300 text-sm font-semibold rounded-full border border-blue-500/20">
              🎓 LD College of Engineering · Ahmedabad
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-[1.05] tracking-tight">
              Your Campus.<br />
              <span className="text-blue-400">Your Voice.</span>
            </h1>
            <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Submit issues in seconds. Track them in real-time. Campus Pulse turns complaints into resolutions — fast.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl text-base transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25">
                Submit a Complaint →
              </Link>
              <Link to="/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-2xl text-base border border-white/20 transition-all">
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="bg-blue-600 py-8 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-white text-center">
          {[['500+','Complaints Resolved'],['50+','Active Students'],['< 3 days','Avg Resolution']].map(([val, label]) => (
            <motion.div key={label} {...fadeUp(0.1)}>
              <p className="text-2xl md:text-3xl font-extrabold">{val}</p>
              <p className="text-blue-200 text-sm mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-6 bg-[#f8f9fc]">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">Everything you need</h2>
            <p className="text-slate-500 text-lg">Powerful tools for students and administrators alike</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={i} {...fadeUp(i * 0.07)}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50 transition-all duration-200 group">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-200">{f.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-3">How it works</h2>
            <p className="text-slate-500">Three steps and your issue is on the radar</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div key={i} {...fadeUp(i * 0.1)} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 font-extrabold text-xl flex items-center justify-center mx-auto mb-5 border-2 border-blue-100">
                  {s.n}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2 text-lg">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6 bg-[#f8f9fc]">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">What students say</h2>
            <p className="text-slate-500">Real feedback from real users</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} {...fadeUp(i * 0.08)}
                className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, j) => <span key={j} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.dept}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white text-center">
        <motion.div {...fadeUp()}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to report an issue?</h2>
          <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">Join hundreds of LDCE students making their campus a better place</p>
          <Link to="/signup"
            className="inline-block px-10 py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-all hover:scale-105 hover:shadow-xl">
            Get Started Free →
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">C</div>
          <span className="font-semibold text-white">Campus Pulse</span>
        </div>
        <p>LD College of Engineering, Ahmedabad · © {new Date().getFullYear()}</p>
        <p className="mt-1 text-slate-500 text-xs">Built for smarter campuses 🎓</p>
      </footer>
    </div>
  );
}
