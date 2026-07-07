import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { 
  Activity, Shield, Clock, Users, Award, Phone, Mail, MapPin, 
  Calendar, ArrowRight, Star, Heart, CheckCircle2, ChevronRight 
} from 'lucide-react';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);

  useEffect(() => {
    async function fetchTherapists() {
      try {
        const { data, error } = await supabase
          .from('therapists')
          .select('*')
          .limit(4);
        if (error) throw error;
        setTherapists(data || []);
      } catch (err) {
        console.error('Failed to load therapists:', err.message);
        // Fallback mock therapists if Supabase is not configured
        setTherapists([
          {
            id: '1',
            name: 'Dr. Sarah Jenkins',
            specialization: 'Sports Injury Rehab',
            experience: 8,
            profile_image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'
          },
          {
            id: '2',
            name: 'Dr. Marcus Chen',
            specialization: 'Neurological Physiotherapy',
            experience: 12,
            profile_image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300'
          },
          {
            id: '3',
            name: 'Dr. Priya Patel',
            specialization: 'Orthopedic Recovery',
            experience: 6,
            profile_image: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300'
          },
          {
            id: '4',
            name: 'Dr. David Miller',
            specialization: 'Pediatric & Geriatric Care',
            experience: 10,
            profile_image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300'
          }
        ]);
      } finally {
        setLoadingTherapists(false);
      }
    }
    fetchTherapists();
  }, []);

  const getBookLink = () => {
    if (!user) return '/login';
    if (profile?.role === 'admin') return '/admin';
    if (profile?.role === 'therapist') return '/doctor';
    return '/dashboard';
  };

  return (
    <div className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 bg-gradient-to-br from-medical-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/50">
        {/* Abstract light rays */}
        <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-medical-500/10 blur-3xl dark:bg-medical-500/5"></div>
        <div className="absolute -bottom-20 left-10 -z-10 h-[400px] w-[400px] rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/5"></div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-medical-200 dark:border-medical-900/30 bg-medical-50/80 dark:bg-medical-950/30 px-3.5 py-1 text-sm font-semibold text-medical-700 dark:text-medical-400">
                <Shield className="h-4 w-4" />
                <span>Premier Clinic Management Platform</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none text-slate-900 dark:text-white">
                Expert Physiotherapy for a <span className="text-medical-500 bg-clip-text">Pain-Free Life</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">
                Book physical therapy sessions with certified specialists instantly. Real-time availability, personalized care plans, and state-of-the-art clinic facilities.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  to={getBookLink()} 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-medical-500 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-medical-500/25 hover:bg-medical-600 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  Book Appointment
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <button 
                  onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80 px-6 py-3.5 text-base font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Our Services
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-6 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 border-t border-slate-200/60 dark:border-slate-800/60">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">99%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Recovery Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">15k+</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Patients Healed</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-slate-900 dark:text-white">4.9★</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Google Review</div>
                </div>
              </div>
            </div>

            {/* Right Image/Mockup */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-[450px]">
                {/* Decorative backgrounds */}
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-sky-200 dark:bg-sky-950/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute -bottom-8 -right-4 w-72 h-72 bg-medical-200 dark:bg-medical-950/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                
                {/* Main Hero Image */}
                <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600" 
                    alt="Physiotherapy treatment" 
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent"></div>
                  
                  {/* Floating card */}
                  <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 border border-white/20 dark:border-slate-800 shadow-lg flex items-center gap-3">
                    <div className="rounded-full bg-medical-500 p-2.5 text-white">
                      <Heart className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Bookings Now</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white">8 slots remaining today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. ABOUT CLINIC */}
      <section id="about" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/50 dark:border-slate-800/50 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 relative">
              <img 
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600" 
                alt="Clinic interior" 
                className="rounded-3xl shadow-xl w-full h-[360px] object-cover"
              />
              <div className="absolute -bottom-6 -right-6 bg-slate-900 dark:bg-medical-500 text-white p-6 rounded-2xl shadow-xl max-w-[200px] hidden sm:block">
                <div className="text-3xl font-extrabold">12+</div>
                <div className="text-sm font-semibold opacity-90">Years of Clinical Excellence</div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div className="text-sm font-bold text-medical-500 tracking-wider uppercase">About Our Clinic</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Modern Facilities. Certified Physiotherapists. Personalized Attention.
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                At PhysioCare, we believe in treating the root cause of physical discomfort, not just the symptoms. Our state-of-the-art clinic features dedicated rehabilitation bays, advanced diagnostic tools, and a welcoming environment.
              </p>
              
              <div className="space-y-4 pt-2">
                {[
                  'Advanced physical rehabilitation equipment',
                  'One-on-one sessions with credentialed medical professionals',
                  'Dynamic real-time online appointment scheduling',
                  'Direct insurance billing support and easy tracking'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-medical-500 mt-0.5 shrink-0" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. SERVICES */}
      <section id="services" className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="text-sm font-bold text-medical-500 tracking-wider uppercase">Clinical Services</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Specialized Physiotherapy Solutions
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              We offer comprehensive services tailored to your clinical requirements, helping you return to peak performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Sports Injury Rehab',
                desc: 'Specialized recovery and performance training for athletes recovering from sprains, tears, or post-surgery restrictions.',
                icon: Award,
              },
              {
                title: 'Post-Operative Recovery',
                desc: 'Structured rehabilitation following orthopedic surgeries to restore mobility, joint stability, and muscle strength.',
                icon: Heart,
              },
              {
                title: 'Chronic Pain Management',
                desc: 'Effective therapies for back pain, neck strain, arthritis, and sciatica utilizing advanced manual techniques.',
                icon: Shield,
              },
              {
                title: 'Orthopedic Rehabilitation',
                desc: 'Focused care for bone, muscle, joint, and ligament disorders, improving flexibility and reducing joint stress.',
                icon: Users,
              },
              {
                title: 'Neurological Care',
                desc: 'Rehabilitative care for patients recovering from stroke, spinal cord injury, Parkinson’s disease, or MS.',
                icon: Activity,
              },
              {
                title: 'Geriatric Rehabilitation',
                desc: 'Gentle exercise and balancing programs designed to improve mobility, reduce fall risks, and enhance independence.',
                icon: Clock,
              }
            ].map((srv, idx) => (
              <div 
                key={idx} 
                className="group rounded-2xl bg-white dark:bg-slate-900 p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md hover:border-medical-500/30 hover:scale-[1.01] transition-all duration-200"
              >
                <div className="inline-flex rounded-xl bg-medical-50 dark:bg-medical-950/50 p-3 text-medical-500 group-hover:bg-medical-500 group-hover:text-white transition-colors duration-200 mb-6">
                  <srv.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{srv.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{srv.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. MEET OUR THERAPISTS */}
      <section id="therapists" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
            <div className="max-w-2xl space-y-4">
              <div className="text-sm font-bold text-medical-500 tracking-wider uppercase">Our Specialists</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                Meet Our Licensed Physiotherapists
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Our board-certified physical therapists are dedicated to guide your recovery pathway with customized treatment models.
              </p>
            </div>
            <Link 
              to={getBookLink()}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-medical-500 hover:text-medical-600 hover:gap-2 transition-all shrink-0"
            >
              Book with a Specialist
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingTherapists ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-slate-100 dark:bg-slate-800 rounded-2xl h-[380px]"></div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {therapists.map((therapist) => (
                <div 
                  key={therapist.id}
                  className="group relative rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <img 
                    src={therapist.profile_image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'} 
                    alt={therapist.name} 
                    className="w-full h-64 object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-medical-500 transition-colors">
                      {therapist.name}
                    </h3>
                    <p className="text-xs font-semibold text-medical-500 mb-2">
                      {therapist.specialization}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span>{therapist.experience} Years Experience</span>
                      <span className="flex items-center gap-0.5 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        4.9
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="text-sm font-bold text-medical-500 tracking-wider uppercase">Testimonials</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              Loved By Our Patients
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Read how our personalized physiotherapy programs have helped patients regain mobility and rebuild active lives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Dr. Sarah Jenkins designed an amazing recovery program for my ACL tear. Within 4 months, I was back on the running track without any residual joint discomfort.",
                author: "James Anderson",
                role: "Marathon Runner",
                stars: 5,
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
              },
              {
                quote: "The admin dashboard is super convenient! Scheduling appointments takes just seconds, and the clinic's automatic bed allocation runs in the background. Staff are brilliant.",
                author: "Eleanor Vance",
                role: "IT Manager",
                stars: 5,
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100"
              },
              {
                quote: "Excellent neurological treatment after my stroke. Dr. Chen is patient, knowledgeable, and helped me restore coordinate arm movements. Highly recommend PhysioCare.",
                author: "Robert Kowalski",
                role: "Retired Architect",
                stars: 5,
                img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100"
              }
            ].map((tst, idx) => (
              <div 
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-8 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-4">
                  {/* Stars */}
                  <div className="flex gap-0.5 text-amber-500">
                    {[...Array(tst.stars)].map((_, i) => (
                      <Star key={i} className="h-4.5 w-4.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed">
                    "{tst.quote}"
                  </p>
                </div>
                
                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <img src={tst.img} alt={tst.author} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{tst.author}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{tst.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. STATISTICS */}
      <section className="relative py-20 bg-slate-900 text-white overflow-hidden">
        {/* Background glow overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[800px] rounded-full bg-medical-500/10 blur-3xl"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Healed Patients', count: '15,000+' },
              { label: 'Active Beds Available', count: '5' },
              { label: 'Certified Therapists', count: '4' },
              { label: 'Recovery Rate', count: '99.4%' }
            ].map((stat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-medical-400">{stat.count}</div>
                <div className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CONTACT SECTION */}
      <section id="contact" className="py-20 bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12">
            
            {/* Contact details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="text-sm font-bold text-medical-500 tracking-wider uppercase">Get In Touch</div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                We Are Here To Assist Your Recovery
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Have questions regarding custom therapy regimes, clinical beds, or insurance procedures? Contact us, and our clinical coordinator will get back to you.
              </p>
              
              <div className="space-y-6 pt-4">
                <div className="flex gap-4">
                  <div className="rounded-xl bg-medical-50 dark:bg-medical-950/40 p-3 text-medical-500 shrink-0">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Call Us</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">+1 (555) 902-3456</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-xl bg-medical-50 dark:bg-medical-950/40 p-3 text-medical-500 shrink-0">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Email Us</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">support@physiocare.clinic</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="rounded-xl bg-medical-50 dark:bg-medical-950/40 p-3 text-medical-500 shrink-0">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Visit Clinic</h4>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      120 Medical Plaza, Suite 400, Chicago, IL 60611
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-7 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/50 p-8 sm:p-10 shadow-sm">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Subject</label>
                  <input 
                    type="text" 
                    placeholder="General Inquiry" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Message</label>
                  <textarea 
                    rows={4}
                    placeholder="How can we help you?" 
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm focus:border-medical-500 focus:outline-none dark:text-white"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
            
            <div className="col-span-2 space-y-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="rounded-xl bg-medical-500 p-2 text-white shadow-lg shadow-medical-500/30">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="font-bold text-lg text-white">
                  Physio<span className="text-medical-500">Care</span>
                </span>
              </Link>
              <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                Empowering patients to lead active, mobile, pain-free lifestyles through advanced physiotherapy treatment and dynamic recovery scheduling.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => document.getElementById('about').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">About Clinic</button></li>
                <li><button onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Services</button></li>
                <li><button onClick={() => document.getElementById('therapists').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Therapists</button></li>
                <li><button onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Contact</button></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider">Working Hours</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Monday - Friday: 9 AM - 5 PM</li>
                <li>Saturday: 9 AM - 2 PM</li>
                <li>Sunday: Closed</li>
                <li className="text-medical-400 font-medium">Emergency Care: 24/7</li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <span>&copy; {new Date().getFullYear()} PhysioCare. All Rights Reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
