import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Bell, Shield, Wallet, Laptop } from 'lucide-react';

export const Settings: React.FC = () => {
  const sections = [
    { icon: User, label: 'Profile Settings', description: 'Update your personal information and photo' },
    { icon: Bell, label: 'Notifications', description: 'Manage how you receive alerts' },
    { icon: Shield, label: 'Security', description: 'Two-factor auth and session management' },
    { icon: Wallet, label: 'Billing & Plan', description: 'Manage your subscription and invoices' },
    { icon: Laptop, label: 'Display', description: 'Theme and appearance preferences' },
  ];

  return (
    <div className="p-6 laptop:p-10 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground text-lg">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => (
          <motion.button
            key={section.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
            className="group flex items-start gap-6 p-6 rounded-[2rem] border border-border/50 bg-card/50 text-left transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
              <section.icon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">{section.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{section.description}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-12 p-8 glass rounded-[2.5rem] border border-glass-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Theme Preference</h2>
            <p className="text-sm text-muted-foreground">Select how SkillStudio looks to you</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {['Light', 'Dark', 'System'].map((t) => (
            <button
              key={t}
              className="px-6 py-4 rounded-2xl bg-muted/30 border border-border/50 text-sm font-bold hover:bg-muted/50 transition-all text-center"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
