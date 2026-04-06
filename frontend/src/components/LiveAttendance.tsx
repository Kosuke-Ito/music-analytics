interface LiveAttendanceProps {
  attendance?: Record<string, number>;
}

export function LiveAttendance({ attendance }: LiveAttendanceProps) {
  if (!attendance || Object.keys(attendance).length === 0) return null;

  const years = Object.keys(attendance).sort();
  const maxVal = Math.max(...Object.values(attendance));

  return (
    <div className="live-attendance-section">
      <span className="chart-section-title">Live Attendance</span>
      <div className="live-attendance">
        {years.map((year) => {
          const val = attendance[year];
          return (
            <div key={year} className="attendance-row">
              <span className="attendance-year">{year}</span>
              <div className="attendance-bar-wrapper">
                <div
                  className="attendance-bar"
                  style={{ width: `${(val / maxVal) * 100}%` }}
                />
              </div>
              <span className="attendance-value">
                {val.toLocaleString("en-US")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
