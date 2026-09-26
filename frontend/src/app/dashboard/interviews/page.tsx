import { Plus, Calendar, Clock, User, Mic, CheckCircle } from 'lucide-react';

const INTERVIEWS = [
  { id: 1, candidate: 'James Okonkwo', vacancy: 'Software Developer', interviewer: 'Sarah Connor', date: '2026-09-26', time: '14:30', type: 'Technical', focus: 'Communication, Problem Solving', status: 'scheduled' },
  { id: 2, candidate: 'Mohamed Jabri', vacancy: 'Software Developer', interviewer: 'David Park', date: '2026-09-26', time: '16:00', type: 'Competency', focus: 'AWS (evidence gap)', status: 'scheduled' },
  { id: 3, candidate: 'Carlos Mendez', vacancy: 'DevOps Engineer', interviewer: 'Sarah Connor', date: '2026-09-25', time: '11:00', type: 'Technical', focus: 'Kubernetes, Docker', status: 'completed' },
  { id: 4, candidate: 'Sara Kim', vacancy: 'Product Designer', interviewer: 'Lisa Chen', date: '2026-09-27', time: '10:00', type: 'Portfolio', focus: 'UX Research, Figma', status: 'scheduled' },
];

const TYPE_COLOR: Record<string, string> = {
  Technical: 'badge-blue',
  Competency: 'badge-purple',
  Portfolio: 'badge-indigo',
  Structured: 'badge-indigo',
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: 'badge-yellow',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

export default function InterviewsPage() {
  const today = INTERVIEWS.filter(i => i.date === '2026-09-26');
  const upcoming = INTERVIEWS.filter(i => i.date > '2026-09-26');
  const past = INTERVIEWS.filter(i => i.date < '2026-09-26');

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Interviews</h1>
            <p className="page-subtitle">Schedule and manage structured candidate interviews</p>
          </div>
          <button className="btn btn-primary"><Plus size={15} />Schedule Interview</button>
        </div>
      </div>

      {/* Today */}
      {today.length > 0 && (
        <>
          <div className="section-title" style={{ marginTop: 0 }}>Today · {today[0].date}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {today.map((i) => (
              <InterviewCard key={i.id} interview={i} highlight />
            ))}
          </div>
        </>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <div className="section-title">Upcoming</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {upcoming.map((i) => (
              <InterviewCard key={i.id} interview={i} />
            ))}
          </div>
        </>
      )}

      {/* Past */}
      {past.length > 0 && (
        <>
          <div className="section-title">Past Interviews</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {past.map((i) => (
              <InterviewCard key={i.id} interview={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InterviewCard({ interview: i, highlight }: { interview: typeof INTERVIEWS[0]; highlight?: boolean }) {
  return (
    <div className="card" style={{
      padding: '18px 22px',
      borderLeft: `3px solid ${highlight ? 'var(--brand)' : 'var(--border)'}`,
      background: highlight ? '#fafbff' : 'var(--white)',
    }}>
      <div className="flex items-center gap-16" style={{ flexWrap: 'wrap' }}>
        {/* Time */}
        <div style={{ minWidth: 80 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: highlight ? 'var(--brand)' : 'var(--text-primary)' }}>{i.time}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.date}</div>
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
            <User size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontWeight: 600, fontSize: 14 }}>{i.candidate}</span>
            <span className="badge badge-gray" style={{ fontSize: 11 }}>{i.vacancy}</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <Mic size={12} style={{ display: 'inline', marginRight: 4 }} />
            Focus: <strong>{i.focus}</strong>
          </div>
        </div>

        {/* Badges and details */}
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <span className={`badge ${TYPE_COLOR[i.type] || 'badge-gray'}`}>{i.type}</span>
          <span className={`badge ${STATUS_COLOR[i.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
            {i.status === 'completed' ? <CheckCircle size={12} style={{ display: 'inline' }} /> : <Clock size={12} style={{ display: 'inline' }} />}
            {' '}{i.status}
          </span>
          <div className="flex items-center gap-1" style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
            <Calendar size={12} />
            {i.interviewer}
          </div>
        </div>

        <button className="btn btn-secondary btn-sm">
          {i.status === 'completed' ? 'View Notes' : 'Join / Manage'}
        </button>
      </div>
    </div>
  );
}
