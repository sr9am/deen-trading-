import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Calendar, Clock, ChevronRight, CheckCircle2, 
  LayoutDashboard, Car, DollarSign, LogOut, X, MessageSquare, 
  Navigation, Check, Send, Loader2 
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('deen_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authMode, setAuthMode] = useState(null); 
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Booking Flow State
  const [serviceType, setServiceType] = useState('one-way');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [hours, setHours] = useState('3');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingStep, setBookingStep] = useState('search');

  // Database States
  const [vehicles, setVehicles] = useState(() => {
    const saved = localStorage.getItem('deen_vehicles');
    return saved ? JSON.parse(saved) : [
      { id: 'v1', name: 'Lincoln Navigator SUV', category: 'First Class SUV', passengers: 6, luggage: 6, baseRate: 150, hourlyRate: 95, image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', active: true },
      { id: 'v2', name: 'Cadillac Escalade', category: 'Executive SUV', passengers: 6, luggage: 6, baseRate: 140, hourlyRate: 90, image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80', active: true }
    ];
  });

  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('deen_bookings');
    return saved ? JSON.parse(saved) : [
      { id: 'BK-9021', clientName: 'Sarah Jenkins', email: 'sarah@example.com', service: 'Airport Transfer', vehicle: 'Lincoln Navigator SUV', pickup: 'IAH Airport', dropoff: 'Post Oak Hotel', date: '2026-10-05', time: '14:30', status: 'Pending', price: 185, driverId: null }
    ];
  });

  const [pricingSettings, setPricingSettings] = useState({ baseMultiplier: 1.0 });
  const [activeAdminTab, setActiveAdminTab] = useState('bookings');

  // Driver State
  const [driverOnline, setDriverOnline] = useState(true);

  // AI Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ role: 'model', text: 'Hello! I am the Deen Trading Assistant. How can I help you with your premium chauffeur booking today?' }]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Persistence
  useEffect(() => { localStorage.setItem('deen_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('deen_bookings', JSON.stringify(bookings)); }, [bookings]);
  useEffect(() => { if (user) localStorage.setItem('deen_user', JSON.stringify(user)); else localStorage.removeItem('deen_user'); }, [user]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;

    const emailStr = emailInput.trim().toLowerCase();
    
    // Role parsing based on email
    if (emailStr === 'admin@deentrading.com') {
      setUser({ name: 'Admin Principal', email: emailStr, role: 'admin', id: 'admin-1' });
    } else if (emailStr === 'driver@deentrading.com') {
      setUser({ name: 'James (Chauffeur)', email: emailStr, role: 'driver', id: 'driver-1' });
    } else {
      setUser({ name: nameInput || emailStr.split('@')[0], email: emailStr, role: 'client', id: `client-${Date.now()}` });
    }
    
    setAuthMode(null);
    setEmailInput('');
    setPasswordInput('');
    setNameInput('');
  };

  const handleCompleteBooking = () => {
    const newBookingObj = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: user.name,
      email: user.email,
      service: serviceType === 'one-way' ? 'One-Way Transfer' : `Hourly Hire (${hours} hrs)`,
      vehicle: selectedVehicle.name,
      pickup: pickup || 'Houston, TX',
      dropoff: dropoff || 'As Directed',
      date: date || '2026-10-01',
      time: time || '10:00',
      status: 'Pending', // Pending -> Accepted -> En Route -> Completed
      price: Math.round((serviceType === 'one-way' ? selectedVehicle.baseRate : selectedVehicle.hourlyRate * Number(hours)) * pricingSettings.baseMultiplier),
      driverId: null
    };
    setBookings([newBookingObj, ...bookings]);
    setBookingStep('confirmation');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    const newMessages = [...chatMessages, { role: 'user', text: userMessage }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsTyping(true);

    try {
      // Format history for Gemini API
      const formattedHistory = newMessages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const payload = {
        contents: formattedHistory,
        systemInstruction: { 
          parts: [{ text: "You are the AI concierge for Deen Trading LLC, a premium chauffeur service based in Houston, Texas. You provide elegant, polite, and helpful answers. You know they offer Airport Transfers, Hourly Hires, and use premium SUVs like Lincoln Navigators and Cadillac Escalades. Keep answers concise." }] 
        },
      };

      // Ensure API key is an empty string so the collaborative environment injects it automatically
      const apiKey = ""; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      const modelReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, my communication network is temporarily experiencing interference. Please try again or contact (346) 658-9990.";
      
      setChatMessages(prev => [...prev, { role: 'model', text: modelReply }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the system right now. Please call us directly for immediate assistance." }]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);


  const driverActiveJob = bookings.find(b => b.driverId === user?.id && ['Accepted', 'En Route'].includes(b.status));
  
  const updateJobStatus = (jobId, newStatus) => {
    setBookings(bookings.map(b => {
      if (b.id === jobId) {
        return { ...b, status: newStatus, driverId: newStatus === 'Pending' ? null : (b.driverId || user.id) };
      }
      return b;
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-zinc-700 pb-20">
      
      {/* HEADER NAVIGATION */}
      <header className="border-b border-zinc-800/80 bg-black/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setBookingStep('search')}>
            <div className="w-10 h-10 rounded-full border border-zinc-600 flex items-center justify-center bg-zinc-900 text-zinc-200 font-serif font-bold text-lg">
              DT
            </div>
            <div>
              <span className="font-serif tracking-widest text-lg font-medium block">DEEN TRADING LLC</span>
              <span className="text-[10px] tracking-widest text-zinc-400 uppercase">Executive Chauffeur Service</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-zinc-200">{user.name}</div>
                  <div className="text-[10px] text-zinc-400 uppercase">
                    {user.role === 'admin' ? 'Administrator' : user.role === 'driver' ? 'Chauffeur' : 'Client Account'}
                  </div>
                </div>
                <button onClick={() => setUser(null)} className="text-xs border border-zinc-700 px-4 py-2 hover:bg-zinc-800 transition-colors uppercase tracking-wider flex items-center gap-2">
                  <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button onClick={() => setAuthMode('signin')} className="text-xs tracking-wider uppercase px-4 py-2 hover:text-white text-zinc-400 transition-colors">Sign In</button>
                <button onClick={() => setAuthMode('signup')} className="text-xs tracking-wider uppercase bg-zinc-100 text-black px-5 py-2 font-medium hover:bg-white transition-colors">Register</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* AUTH MODAL */}
      {authMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 max-w-md w-full p-8 relative shadow-2xl">
            <button onClick={() => setAuthMode(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X size={20}/></button>
            <h3 className="font-serif text-2xl mb-2 text-center">{authMode === 'signin' ? 'Sign In' : 'Create Account'}</h3>
            <form onSubmit={handleAuthSubmit} className="space-y-4 mt-6">
              {authMode === 'signup' && (
                <input type="text" required value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Full Name" className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500" />
              )}
              <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="Email Address" className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500" />
              <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Password" className="w-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500" />
              <button type="submit" className="w-full bg-zinc-100 text-black py-3 text-xs tracking-widest uppercase font-medium hover:bg-white mt-2">{authMode === 'signin' ? 'Sign In' : 'Create Account'}</button>
            </form>
            <div className="mt-6 text-center text-[10px] text-zinc-500 space-y-1">
              <p>Admin Login: admin@deentrading.com</p>
              <p>Driver Login: driver@deentrading.com</p>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* === ADMIN PORTAL === */}
        {user?.role === 'admin' && (
          <main>
             <div className="flex justify-between items-center pb-6 mb-8 border-b border-zinc-800">
              <div>
                <h1 className="font-serif text-3xl font-light">Control Center</h1>
                <p className="text-sm text-zinc-400 mt-1">Full system overview</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <div className="text-xs uppercase tracking-wider text-zinc-400">Total Bookings</div>
                <div className="text-3xl font-serif mt-2">{bookings.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <div className="text-xs uppercase tracking-wider text-zinc-400">Fleet Size</div>
                <div className="text-3xl font-serif mt-2">{vehicles.length}</div>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 p-6">
                <div className="text-xs uppercase tracking-wider text-zinc-400">Projected Revenue</div>
                <div className="text-3xl font-serif mt-2">${bookings.reduce((acc, b) => acc + b.price, 0)}</div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
                    <th className="p-4">ID / Client</th>
                    <th className="p-4">Route</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Driver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-sm">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-800/40">
                      <td className="p-4"><div className="font-mono">{b.id}</div><div className="text-xs text-zinc-400">{b.clientName}</div></td>
                      <td className="p-4 text-xs text-zinc-300">From: {b.pickup}<br/>To: {b.dropoff}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 text-[10px] uppercase tracking-wider border border-zinc-700">{b.status}</span>
                      </td>
                      <td className="p-4 text-xs text-zinc-400">{b.driverId || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>
        )}

        {/* === DRIVER PORTAL === */}
        {user?.role === 'driver' && (
          <main className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center pb-6 mb-8 border-b border-zinc-800">
              <div>
                <h1 className="font-serif text-3xl font-light">Chauffeur Terminal</h1>
                <p className="text-sm text-zinc-400 mt-1">Manage your active routes and incoming dispatch requests.</p>
              </div>
              <button 
                onClick={() => setDriverOnline(!driverOnline)}
                className={`mt-4 md:mt-0 px-6 py-2.5 text-xs uppercase tracking-widest font-medium border ${driverOnline ? 'bg-emerald-950 text-emerald-400 border-emerald-900' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
              >
                Status: {driverOnline ? 'Online & Available' : 'Offline'}
              </button>
            </div>

            {/* Active Job View */}
            {driverActiveJob ? (
              <div className="bg-zinc-900 border border-zinc-700 p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <h2 className="text-xs uppercase tracking-widest text-emerald-400 mb-4 flex items-center gap-2"><CheckCircle2 size={16}/> Active Mission</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Client</div>
                      <div className="text-lg">{driverActiveJob.clientName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Service</div>
                      <div className="text-lg">{driverActiveJob.service}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-zinc-500">Schedule</div>
                      <div className="text-lg">{driverActiveJob.date} at {driverActiveJob.time}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-black border border-zinc-800 p-4">
                      <div className="text-[10px] uppercase text-zinc-500 mb-1">Pickup Location</div>
                      <div className="text-sm mb-3">{driverActiveJob.pickup}</div>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(driverActiveJob.pickup)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 px-4 py-2 transition-colors">
                        <Navigation size={14} /> Navigate to Pickup
                      </a>
                    </div>
                    <div className="bg-black border border-zinc-800 p-4">
                      <div className="text-[10px] uppercase text-zinc-500 mb-1">Dropoff Location</div>
                      <div className="text-sm mb-3">{driverActiveJob.dropoff}</div>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(driverActiveJob.dropoff)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 px-4 py-2 transition-colors">
                        <Navigation size={14} /> Navigate to Dropoff
                      </a>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-wrap gap-4">
                  {driverActiveJob.status === 'Accepted' && (
                    <button onClick={() => updateJobStatus(driverActiveJob.id, 'En Route')} className="bg-white text-black px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-zinc-200">
                      Mark En Route
                    </button>
                  )}
                  {driverActiveJob.status === 'En Route' && (
                    <button onClick={() => updateJobStatus(driverActiveJob.id, 'Completed')} className="bg-emerald-600 text-white px-6 py-3 text-xs uppercase tracking-widest font-medium hover:bg-emerald-500">
                      Complete Job
                    </button>
                  )}
                  <button onClick={() => updateJobStatus(driverActiveJob.id, 'Pending')} className="text-xs uppercase text-red-400 hover:text-red-300 border border-red-900/50 px-6 py-3">
                    Cancel & Release
                  </button>
                </div>
              </div>
            ) : (
              /* Available Jobs List */
              <div className="space-y-6">
                <h2 className="text-sm uppercase tracking-widest text-zinc-400">Available Dispatch Requests</h2>
                {bookings.filter(b => b.status === 'Pending').length === 0 ? (
                  <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 text-zinc-500 text-sm">
                    No pending dispatch requests at this time.
                  </div>
                ) : (
                  bookings.filter(b => b.status === 'Pending').map(job => (
                    <div key={job.id} className="bg-zinc-900 border border-zinc-800 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="w-full md:w-auto flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-mono text-zinc-300">{job.id}</span>
                          <span className="text-emerald-400 font-mono">${job.price} Payout</span>
                        </div>
                        <h4 className="font-serif text-xl mb-1">{job.service}</h4>
                        <div className="text-xs text-zinc-400 space-y-1">
                          <p><strong>From:</strong> {job.pickup}</p>
                          <p><strong>To:</strong> {job.dropoff}</p>
                          <p className="text-zinc-300 mt-2">{job.date} @ {job.time}</p>
                        </div>
                      </div>
                      <button 
                        disabled={!driverOnline}
                        onClick={() => updateJobStatus(job.id, 'Accepted')}
                        className={`w-full md:w-auto px-8 py-4 text-xs uppercase tracking-widest font-medium transition-colors ${driverOnline ? 'bg-zinc-100 text-black hover:bg-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                      >
                        Accept Job
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </main>
        )}

        {/* === CLIENT PORTAL === */}
        {(!user || user.role === 'client') && (
          <main>
            {/* HERO & BOOKING WIDGET */}
            <div className="relative rounded-sm overflow-hidden mb-20 bg-zinc-900 flex flex-col md:flex-row">
              {/* Left Side: Forms */}
              <div className="w-full md:w-1/2 p-8 md:p-12 bg-black/60 backdrop-blur-md border border-zinc-800 z-10">
                <span className="text-xs tracking-[0.3em] uppercase text-zinc-400 block mb-3">RESERVE YOUR CHAUFFEUR</span>
                <h1 className="font-serif text-3xl font-light tracking-wide mb-8">Uncompromising Standard of Travel.</h1>
                
                {bookingStep === 'search' && (
                  <div className="space-y-5">
                    <div className="flex space-x-6 border-b border-zinc-800 pb-3 text-xs uppercase tracking-wider">
                      <button onClick={() => setServiceType('one-way')} className={`pb-1 ${serviceType === 'one-way' ? 'border-b-2 border-zinc-100 text-white font-medium' : 'text-zinc-500'}`}>One-Way</button>
                      <button onClick={() => setServiceType('hourly')} className={`pb-1 ${serviceType === 'hourly' ? 'border-b-2 border-zinc-100 text-white font-medium' : 'text-zinc-500'}`}>Hourly</button>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Pickup Location</label>
                      <input type="text" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Enter address or airport" className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500" />
                    </div>
                    {serviceType === 'one-way' ? (
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Drop-off Location</label>
                        <input type="text" value={dropoff} onChange={(e) => setDropoff(e.target.value)} placeholder="Enter destination" className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Duration</label>
                        <select value={hours} onChange={(e) => setHours(e.target.value)} className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500">
                          <option value="3">3 Hours</option>
                          <option value="6">6 Hours</option>
                          <option value="8">8 Hours (Full Day)</option>
                        </select>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Time</label>
                        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-black border border-zinc-800 px-4 py-3 text-sm focus:border-zinc-500" />
                      </div>
                    </div>

                    <button 
                      onClick={() => { if (!user) { setAuthMode('signin'); return; } setBookingStep('vehicles'); }}
                      className="w-full bg-zinc-100 text-black py-4 text-xs tracking-widest uppercase font-medium hover:bg-white mt-4 transition-colors"
                    >
                      Search Vehicles
                    </button>
                  </div>
                )}

                {/* Other steps simplified for brevity but fully functional */}
                {bookingStep === 'vehicles' && (
                  <div className="space-y-4">
                    <button onClick={() => setBookingStep('search')} className="text-xs text-zinc-500 mb-4">← Back to Search</button>
                    {vehicles.filter(v => v.active).map(v => (
                      <div key={v.id} onClick={() => { setSelectedVehicle(v); setBookingStep('details'); }} className="border border-zinc-800 p-4 cursor-pointer hover:border-zinc-500 bg-black">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-[10px] uppercase text-zinc-500">{v.category}</div>
                            <div className="font-serif text-lg">{v.name}</div>
                          </div>
                          <div className="font-mono text-lg">${Math.round((serviceType === 'one-way' ? v.baseRate : v.hourlyRate * Number(hours)) * pricingSettings.baseMultiplier)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {bookingStep === 'details' && (
                  <div className="space-y-6">
                    <h3 className="font-serif text-xl">Review Reservation</h3>
                    <div className="bg-black p-4 border border-zinc-800 text-sm space-y-2 text-zinc-300">
                      <p><strong>Route:</strong> {pickup || 'Houston'} → {dropoff || 'As Directed'}</p>
                      <p><strong>Time:</strong> {date} @ {time}</p>
                      <p><strong>Vehicle:</strong> {selectedVehicle?.name}</p>
                    </div>
                    <button onClick={handleCompleteBooking} className="w-full bg-zinc-100 text-black py-4 text-xs uppercase tracking-widest font-medium hover:bg-white">
                      Confirm & Dispatch
                    </button>
                  </div>
                )}

                {bookingStep === 'confirmation' && (
                  <div className="text-center py-10 space-y-4">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                    <h3 className="font-serif text-2xl">Booking Confirmed</h3>
                    <p className="text-xs text-zinc-400">Your chauffeur has been alerted. We will email you the details.</p>
                    <button onClick={() => setBookingStep('search')} className="bg-zinc-800 px-6 py-3 text-xs uppercase text-white hover:bg-zinc-700">New Booking</button>
                  </div>
                )}
              </div>

              {}
              {/* Right Side: Map Integration */}
              <div className="w-full md:w-1/2 min-h-[400px] relative bg-zinc-800">
                {/* Visual Map Overlay representation using Google Maps Embed */}
                {pickup ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(100%)' }} // Dark mode CSS trick for iframe
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(pickup)}&t=&z=13&ie=UTF8&iwloc=&output=embed`} 
                    allowFullScreen 
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-black/40">
                    <MapPin size={48} strokeWidth={1} className="text-zinc-600 mb-4" />
                    <p className="text-sm text-zinc-400">Enter a pickup location to view the interactive map routing.</p>
                  </div>
                )}
                
                {/* Floating tooltip for maps */}
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur border border-zinc-800 px-4 py-2 text-[10px] uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Navigation size={12} /> Live Routing API Connected
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {}
      {/* AI ASSISTANT CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-zinc-950 border border-zinc-800 w-[350px] h-[450px] mb-4 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-serif text-sm">Deen AI Assistant</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-zinc-400 hover:text-white"><X size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-black/50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-zinc-800 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 text-zinc-500 flex gap-1">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-zinc-900 border-t border-zinc-800">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about fleets, pricing..." 
                  className="w-full bg-black border border-zinc-700 py-2.5 pl-3 pr-10 text-sm focus:border-zinc-500 focus:outline-none text-white"
                />
                <button onClick={handleSendMessage} disabled={isTyping} className="absolute right-2 top-2 text-zinc-400 hover:text-white disabled:opacity-50">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="w-14 h-14 bg-zinc-100 text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      </div>

    </div>
  );
}