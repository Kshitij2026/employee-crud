import { useEffect, useState } from "react";

const empty = { name: "", email: "", department: "", designation: "", salary: "" };
const api = "/api/employees";

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(api);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Could not load employees");
    setEmployees(data);
  }
  useEffect(() => { load().catch(e => setMessage(e.message)); }, []);

  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMessage("");
    try {
      const url = editing ? `${api}/${editing}` : api;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, salary: Number(form.salary) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Save failed");
      const id = data._id || editing;
      if (photo && id) {
        const fd = new FormData(); fd.append("photo", photo);
        const uploadRes = await fetch(`${api}/${id}/photo`, { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.message || "Photo upload failed");
      }
      setForm(empty); setEditing(null); setPhoto(null);
      document.getElementById("photo").value = "";
      setMessage(editing ? "Employee updated." : "Employee added.");
      await load();
    } catch (err) { setMessage(err.message); }
    finally { setBusy(false); }
  }

  function edit(emp) {
    setEditing(emp._id);
    setForm({ name: emp.name, email: emp.email, department: emp.department, designation: emp.designation, salary: emp.salary });
    setPhoto(null); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id) {
    if (!confirm("Delete this employee?")) return;
    try {
      const res = await fetch(`${api}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      setMessage("Employee deleted."); await load();
    } catch (err) { setMessage(err.message); }
  }

  return <main className="wrap">
    <header><div><p className="eyebrow">REACT · NODE.JS · MONGODB · AWS S3</p><h1>Employee Manager</h1><p className="sub">A simple three-tier CRUD application</p></div><span className="count">{employees.length} employees</span></header>
    <section className="panel">
      <h2>{editing ? "Update employee" : "Add an employee"}</h2>
      <form onSubmit={submit}>
        <div className="fields">
          <label>Full name<input name="name" value={form.name} onChange={change} required placeholder="e.g. Aditi Sharma" /></label>
          <label>Email<input name="email" type="email" value={form.email} onChange={change} required placeholder="aditi@example.com" /></label>
          <label>Department<input name="department" value={form.department} onChange={change} required placeholder="Engineering" /></label>
          <label>Designation<input name="designation" value={form.designation} onChange={change} required placeholder="Software Engineer" /></label>
          <label>Salary (₹)<input name="salary" type="number" min="0" value={form.salary} onChange={change} required placeholder="45000" /></label>
          <label>Profile photo (JPG/PNG/WEBP, max 5 MB)<input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setPhoto(e.target.files[0] || null)} /></label>
        </div>
        <div className="actions"><button disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add employee"}</button>{editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); setPhoto(null); }}>Cancel</button>}</div>
      </form>
      {message && <p className="message" role="status">{message}</p>}
    </section>
    <section className="panel">
      <div className="list-head"><h2>Employee records</h2><button className="secondary" onClick={() => load().catch(e => setMessage(e.message))}>Refresh</button></div>
      {employees.length === 0 ? <p className="empty">No employees yet. Add your first record above.</p> :
      <div className="table-wrap"><table><thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Salary</th><th>Actions</th></tr></thead>
      <tbody>{employees.map(emp => <tr key={emp._id}><td><div className="person">{emp.photoUrl ? <img src={emp.photoUrl} alt="" /> : <span className="avatar">{emp.name[0]?.toUpperCase()}</span>}<div><b>{emp.name}</b><small>{emp.email}</small></div></div></td><td>{emp.department}</td><td>{emp.designation}</td><td>₹{Number(emp.salary).toLocaleString("en-IN")}</td><td><div className="row-actions"><button className="small secondary" onClick={() => edit(emp)}>Edit</button><button className="small danger" onClick={() => remove(emp._id)}>Delete</button></div></td></tr>)}</tbody></table></div>}
    </section>
    <footer>Files are stored in Amazon S3. Employee details and S3 object keys are stored in MongoDB.</footer>
  </main>;
}
