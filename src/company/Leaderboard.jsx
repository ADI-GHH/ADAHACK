import React from 'react';
import { getLeaderboardRows, getDepartmentRows } from '../data';
import Icon from '../ui/Icon';

const signed = value => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;

export default function Leaderboard({ snapshot }) {
  const [view, setView] = React.useState('employees');
  const employees = React.useMemo(() => getLeaderboardRows(snapshot), [snapshot]);
  const departments = React.useMemo(() => getDepartmentRows(snapshot), [snapshot]);
  const employeeView = view === 'employees';
  const rows = employeeView ? employees.slice(0, 10) : departments;
  return <section className="leaderboard" aria-labelledby="leaderboard-heading">
    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
      <div>
        <h2 id="leaderboard-heading" className="text-xl font-semibold text-gray-900">Company leaderboard</h2>
        <p className="mt-1 text-sm text-gray-500">{employeeView ? `Top 10 of ${employees.length} generated employees, ranked by monthly balance.` : 'Departments ranked by average employee balance.'}</p>
      </div>
      <div className="leaderboard-switch" role="group" aria-label="Leaderboard view">
        {[['employees', 'Top employees'], ['departments', 'Departments']].map(([value, label]) => <button type="button" key={value} onClick={() => setView(value)} aria-pressed={view === value}
          className={`px-3 py-2 text-sm rounded-md focus-visible:ring-2 focus-visible:ring-primary-500 ${view === value ? 'bg-white text-primary-700 shadow-sm font-medium' : 'text-gray-600'}`}>{label}</button>)}
      </div>
    </div>
    {employeeView && <div className="leaderboard-podium" aria-label="Top three mock employees">
      {[employees[1], employees[0], employees[2]].filter(Boolean).map(employee => <div key={employee.id} className={`podium-place place-${employee.rank}`}>
        <span className="podium-rank">{employee.rank === 1 ? <Icon name="leaderboard" size={20}/> : `#${employee.rank}`}</span>
        <span className="employee-avatar" data-initials={employee.name.split(' ').map(word => word[0]).slice(0, 2).join('')} aria-hidden="true"/>
        <strong>{employee.name}</strong><span>{employee.department}</span>
        <p>{employee.monthlyBalance.toFixed(2)}<small>green credits</small></p>
      </div>)}
    </div>}
    <div className="leaderboard-table-wrap" role="region" aria-label="Leaderboard table" tabIndex={0}>
      <table className="leaderboard-table">
        <caption className="sr-only">{employeeView ? 'Mock employee monthly leaderboard' : 'Mock department monthly leaderboard'}</caption>
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th scope="col" className="px-3 py-3 font-medium">Rank</th>
            <th scope="col" className="px-3 py-3 font-medium">{employeeView ? 'Employee' : 'Department'}</th>
            <th scope="col" className="px-3 py-3 font-medium">{employeeView ? 'Department' : 'Employees'}</th>
            <th scope="col" className="px-3 py-3 font-medium text-right">{employeeView ? 'Balance' : 'Avg balance'}</th>
            <th scope="col" className="px-3 py-3 font-medium text-right">Monthly net</th>
            <th scope="col" className="px-3 py-3 font-medium text-right">Active km</th>
            <th scope="col" className="px-3 py-3 font-medium text-right">CO₂e kg</th>
            <th scope="col" className="px-3 py-3 font-medium text-right">High-carbon trips</th>
            {employeeView && <th scope="col" className="px-3 py-3 font-medium text-right">Streak</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => <tr key={employeeView ? row.id : row.department} className="hover:bg-gray-50">
            <td className="rank-cell">{row.rank}</td>
            <th scope="row" className="employee-cell">{employeeView && <span className="employee-avatar" aria-hidden="true" data-initials={row.name.split(' ').map(word => word[0]).slice(0, 2).join('')}/>}<span>{employeeView ? row.name : row.department}</span></th>
            <td data-label={employeeView ? 'Department' : 'Employees'} className="department-cell">{employeeView ? row.department : row.employees}</td>
            <td data-label={employeeView ? 'Balance' : 'Avg balance'} className="balance-cell tabular-nums">{(employeeView ? row.monthlyBalance : row.avgBalance).toFixed(2)}</td>
            <td data-label="Monthly net" className={`net-cell tabular-nums ${row.monthlyCreditDelta >= 0 ? 'text-earn-600' : 'text-deduct-600'}`}>{signed(row.monthlyCreditDelta)}</td>
            <td data-label="Active km" className="tabular-nums">{row.activeKm.toFixed(1)}</td>
            <td data-label="CO₂e kg" className="tabular-nums">{row.emissionsKg.toFixed(3)}</td>
            <td data-label="Car trips" className="tabular-nums">{row.highCarbonTrips}</td>
            {employeeView && <td data-label="Streak" className="tabular-nums">{row.streak}</td>}
          </tr>)}
        </tbody>
      </table>
    </div>
    <p className="mt-3 text-xs text-gray-500">Mock database for hackathon demo purposes. Streak counts consecutive non-car commutes. Department net credits, distance, emissions and trips are totals.</p>
  </section>;
}
