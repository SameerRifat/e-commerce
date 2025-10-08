// app/(main)/profile/security/page.js
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Key,
  CheckCircle,
  Info,
  Phone
} from 'lucide-react';

const ProfileSecurityPage = () => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [contactForm, setContactForm] = useState({
    email: 'alexjohn@gmail.com',
    phone: '+92 300 1234567'
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    securityAlerts: true,
    marketingEmails: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsLoading(false);
      alert('Password updated successfully');
    }, 1500);
  };

  const handleContactUpdate = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Contact information updated successfully');
    }, 1000);
  };

  const handleNotificationToggle = (setting) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Security Settings
        </h2>
        <p className="text-muted-foreground">Manage your account security and contact information</p>
      </div>

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Account Security Status
          </CardTitle>
          <CardDescription>Your account security overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-4 h-4 text-green-600" />
              </div>
              <p className="font-medium">Password Protected</p>
              <p className="text-xs text-muted-foreground">Secure login</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              <p className="font-medium">Email Verified</p>
              <p className="text-xs text-muted-foreground">alexjohn@gmail.com</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <p className="font-medium">Phone Verified</p>
              <p className="text-xs text-muted-foreground">+92 300 ****567</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Use a strong password with at least 8 characters, including letters, numbers, and symbols.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handlePasswordChange} 
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Contact Information
          </CardTitle>
          <CardDescription>Update your email and phone number</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleContactUpdate} 
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Contact Information'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Order Updates</p>
                <p className="text-sm text-muted-foreground">Notifications about your order status</p>
              </div>
              <Switch
                checked={notifications.orderUpdates}
                onCheckedChange={() => handleNotificationToggle('orderUpdates')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Security Alerts</p>
                <p className="text-sm text-muted-foreground">Important account security notifications</p>
              </div>
              <Switch
                checked={notifications.securityAlerts}
                onCheckedChange={() => handleNotificationToggle('securityAlerts')}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing Emails</p>
                <p className="text-sm text-muted-foreground">Promotional offers and product updates</p>
              </div>
              <Switch
                checked={notifications.marketingEmails}
                onCheckedChange={() => handleNotificationToggle('marketingEmails')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account created:</span>
            <span>January 20, 2023</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last login:</span>
            <span>August 18, 2024 at 2:30 PM</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account status:</span>
            <span className="text-green-600 font-medium">Active</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSecurityPage;

// // app/(main)/profile/security/page.js
// 'use client';

// import { useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { Separator } from '@/components/ui/separator';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import {
//   Shield,
//   Lock,
//   Smartphone,
//   Mail,
//   AlertTriangle,
//   CheckCircle,
//   Eye,
//   EyeOff,
//   Key,
//   LogOut,
//   Monitor,
//   MapPin,
//   Clock,
//   Trash2,
//   Download,
//   Settings,
//   Info
// } from 'lucide-react';

// const ProfileSecurityPage = () => {
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [securitySettings, setSecuritySettings] = useState({
//     twoFactorEnabled: true,
//     emailNotifications: true,
//     smsNotifications: false,
//     loginAlerts: true,
//     marketingEmails: true,
//     orderUpdates: true
//   });

//   // Static security data
//   const securityInfo = {
//     lastPasswordChange: "2024-06-15",
//     accountCreated: "2023-01-20",
//     twoFactorEnabled: true,
//     recoveryCodesGenerated: "2024-06-15",
//     lastSecurityReview: "2024-08-10"
//   };

//   const loginSessions = [
//     {
//       id: 1,
//       device: "Chrome on Windows",
//       location: "Islamabad, Pakistan",
//       ip: "192.168.1.100",
//       lastActive: "2024-08-18 14:30",
//       current: true
//     },
//     {
//       id: 2,
//       device: "Safari on iPhone",
//       location: "Islamabad, Pakistan", 
//       ip: "192.168.1.101",
//       lastActive: "2024-08-17 09:15",
//       current: false
//     },
//     {
//       id: 3,
//       device: "Chrome on Android",
//       location: "Lahore, Pakistan",
//       ip: "203.124.45.67",
//       lastActive: "2024-08-15 18:22",
//       current: false
//     }
//   ];

//   const loginHistory = [
//     {
//       id: 1,
//       device: "Chrome on Windows",
//       location: "Islamabad, Pakistan",
//       ip: "192.168.1.100",
//       timestamp: "2024-08-18 14:30",
//       status: "success"
//     },
//     {
//       id: 2,
//       device: "Safari on iPhone",
//       location: "Islamabad, Pakistan",
//       ip: "192.168.1.101", 
//       timestamp: "2024-08-17 09:15",
//       status: "success"
//     },
//     {
//       id: 3,
//       device: "Unknown Device",
//       location: "Karachi, Pakistan",
//       ip: "180.92.14.23",
//       timestamp: "2024-08-15 23:45",
//       status: "blocked"
//     },
//     {
//       id: 4,
//       device: "Chrome on Android",
//       location: "Lahore, Pakistan", 
//       ip: "203.124.45.67",
//       timestamp: "2024-08-15 18:22",
//       status: "success"
//     }
//   ];

//   const handlePasswordChange = () => {
//     // Handle password change logic
//     console.log('Password change:', passwordForm);
//     setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
//   };

//   const handleSettingToggle = (setting) => {
//     setSecuritySettings(prev => ({
//       ...prev,
//       [setting]: !prev[setting]
//     }));
//   };

//   const terminateSession = (sessionId) => {
//     // Handle session termination
//     console.log('Terminate session:', sessionId);
//   };

//   const terminateAllSessions = () => {
//     // Handle terminate all sessions
//     console.log('Terminate all sessions');
//   };

//   const downloadData = () => {
//     // Handle data download
//     console.log('Download user data');
//   };

//   const deleteAccount = () => {
//     // Handle account deletion
//     console.log('Delete account');
//     setShowDeleteDialog(false);
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div>
//         <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
//           <Shield className="w-6 h-6" />
//           Security Settings
//         </h2>
//         <p className="text-muted-foreground">Manage your account security and privacy</p>
//       </div>

//       {/* Security Overview */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <CheckCircle className="w-5 h-5 text-green-600" />
//             Account Security Status
//           </CardTitle>
//           <CardDescription>Your account security health overview</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="text-center p-4 border rounded-lg">
//               <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
//                 <Lock className="w-4 h-4 text-green-600" />
//               </div>
//               <p className="font-medium">Strong Password</p>
//               <p className="text-xs text-muted-foreground">Last changed {securityInfo.lastPasswordChange}</p>
//             </div>
//             <div className="text-center p-4 border rounded-lg">
//               <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
//                 <Smartphone className="w-4 h-4 text-green-600" />
//               </div>
//               <p className="font-medium">2FA Enabled</p>
//               <p className="text-xs text-muted-foreground">Active protection</p>
//             </div>
//             <div className="text-center p-4 border rounded-lg">
//               <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
//                 <Mail className="w-4 h-4 text-green-600" />
//               </div>
//               <p className="font-medium">Email Verified</p>
//               <p className="text-xs text-muted-foreground">alexjohn@gmail.com</p>
//             </div>
//             <div className="text-center p-4 border rounded-lg">
//               <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
//                 <Shield className="w-4 h-4 text-blue-600" />
//               </div>
//               <p className="font-medium">Security Score</p>
//               <p className="text-xs text-muted-foreground">85/100 (Very Good)</p>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Change Password */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Key className="w-5 h-5" />
//             Change Password
//           </CardTitle>
//           <CardDescription>Update your account password for better security</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Alert>
//             <Info className="h-4 w-4" />
//             <AlertDescription>
//               Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and symbols.
//             </AlertDescription>
//           </Alert>
          
//           <div className="grid gap-4">
//             <div className="space-y-2">
//               <Label htmlFor="current-password">Current Password</Label>
//               <div className="relative">
//                 <Input
//                   id="current-password"
//                   type={showCurrentPassword ? "text" : "password"}
//                   value={passwordForm.currentPassword}
//                   onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
//                   placeholder="Enter current password"
//                 />
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                   onClick={() => setShowNewPassword(!showNewPassword)}
//                 >
//                   {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                 </Button>
//               </div>
//             </div>
            
//             <div className="space-y-2">
//               <Label htmlFor="confirm-password">Confirm New Password</Label>
//               <div className="relative">
//                 <Input
//                   id="confirm-password"
//                   type={showConfirmPassword ? "text" : "password"}
//                   value={passwordForm.confirmPassword}
//                   onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
//                   placeholder="Confirm new password"
//                 />
//                 <Button
//                   variant="ghost"
//                   size="sm"
//                   className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 >
//                   {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                 </Button>
//               </div>
//             </div>
//           </div>
          
//           <Button onClick={handlePasswordChange} className="w-full sm:w-auto">
//             Update Password
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Two-Factor Authentication */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Smartphone className="w-5 h-5" />
//             Two-Factor Authentication
//           </CardTitle>
//           <CardDescription>Add an extra layer of security to your account</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center justify-between p-4 border rounded-lg">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
//                 <Smartphone className="w-5 h-5 text-green-600" />
//               </div>
//               <div>
//                 <p className="font-medium">Authenticator App</p>
//                 <p className="text-sm text-muted-foreground">
//                   {securitySettings.twoFactorEnabled ? 'Currently enabled' : 'Not configured'}
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <Badge variant={securitySettings.twoFactorEnabled ? "default" : "secondary"}>
//                 {securitySettings.twoFactorEnabled ? 'Active' : 'Inactive'}
//               </Badge>
//               <Switch
//                 checked={securitySettings.twoFactorEnabled}
//                 onCheckedChange={() => handleSettingToggle('twoFactorEnabled')}
//               />
//             </div>
//           </div>
          
//           {securitySettings.twoFactorEnabled && (
//             <div className="space-y-3 ml-4 pl-4 border-l-2 border-muted">
//               <div className="flex items-center justify-between">
//                 <p className="text-sm">Recovery codes generated</p>
//                 <p className="text-sm text-muted-foreground">{securityInfo.recoveryCodesGenerated}</p>
//               </div>
//               <Button variant="outline" size="sm">
//                 <Download className="w-4 h-4 mr-2" />
//                 Download Backup Codes
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Notification Preferences */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Mail className="w-5 h-5" />
//             Notification Preferences
//           </CardTitle>
//           <CardDescription>Control how you receive security and account notifications</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="font-medium">Login Alerts</p>
//                 <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
//               </div>
//               <Switch
//                 checked={securitySettings.loginAlerts}
//                 onCheckedChange={() => handleSettingToggle('loginAlerts')}
//               />
//             </div>
            
//             <Separator />
            
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="font-medium">Email Notifications</p>
//                 <p className="text-sm text-muted-foreground">Security updates and account changes</p>
//               </div>
//               <Switch
//                 checked={securitySettings.emailNotifications}
//                 onCheckedChange={() => handleSettingToggle('emailNotifications')}
//               />
//             </div>
            
//             <Separator />
            
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="font-medium">SMS Notifications</p>
//                 <p className="text-sm text-muted-foreground">Critical security alerts via SMS</p>
//               </div>
//               <Switch
//                 checked={securitySettings.smsNotifications}
//                 onCheckedChange={() => handleSettingToggle('smsNotifications')}
//               />
//             </div>
            
//             <Separator />
            
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="font-medium">Order Updates</p>
//                 <p className="text-sm text-muted-foreground">Email notifications for order status changes</p>
//               </div>
//               <Switch
//                 checked={securitySettings.orderUpdates}
//                 onCheckedChange={() => handleSettingToggle('orderUpdates')}
//               />
//             </div>
            
//             <Separator />
            
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="font-medium">Marketing Emails</p>
//                 <p className="text-sm text-muted-foreground">Promotional offers and product updates</p>
//               </div>
//               <Switch
//                 checked={securitySettings.marketingEmails}
//                 onCheckedChange={() => handleSettingToggle('marketingEmails')}
//               />
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Active Sessions */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Monitor className="w-5 h-5" />
//             Active Sessions
//           </CardTitle>
//           <CardDescription>Manage your active login sessions across devices</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex justify-between items-center">
//             <p className="text-sm text-muted-foreground">
//               {loginSessions.length} active session(s)
//             </p>
//             <Button variant="outline" size="sm" onClick={terminateAllSessions}>
//               <LogOut className="w-4 h-4 mr-2" />
//               End All Sessions
//             </Button>
//           </div>
          
//           <div className="space-y-3">
//             {loginSessions.map((session) => (
//               <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
//                     <Monitor className="w-5 h-5" />
//                   </div>
//                   <div>
//                     <div className="flex items-center gap-2">
//                       <p className="font-medium">{session.device}</p>
//                       {session.current && (
//                         <Badge variant="default" className="text-xs">Current</Badge>
//                       )}
//                     </div>
//                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
//                       <span className="flex items-center gap-1">
//                         <MapPin className="w-3 h-3" />
//                         {session.location}
//                       </span>
//                       <span className="flex items-center gap-1">
//                         <Clock className="w-3 h-3" />
//                         {session.lastActive}
//                       </span>
//                     </div>
//                     <p className="text-xs text-muted-foreground">IP: {session.ip}</p>
//                   </div>
//                 </div>
//                 {!session.current && (
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => terminateSession(session.id)}
//                   >
//                     <LogOut className="w-4 h-4 mr-2" />
//                     End Session
//                   </Button>
//                 )}
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Login History */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Clock className="w-5 h-5" />
//             Recent Login Activity
//           </CardTitle>
//           <CardDescription>Monitor recent login attempts to your account</CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-3">
//             {loginHistory.map((login) => (
//               <div key={login.id} className="flex items-center justify-between p-3 border rounded-lg">
//                 <div className="flex items-center gap-3">
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                     login.status === 'success' ? 'bg-green-100' : 'bg-red-100'
//                   }`}>
//                     {login.status === 'success' ? (
//                       <CheckCircle className="w-4 h-4 text-green-600" />
//                     ) : (
//                       <AlertTriangle className="w-4 h-4 text-red-600" />
//                     )}
//                   </div>
//                   <div>
//                     <p className="font-medium text-sm">{login.device}</p>
//                     <div className="flex items-center gap-2 text-xs text-muted-foreground">
//                       <span>{login.location}</span>
//                       <span>•</span>
//                       <span>{login.ip}</span>
//                     </div>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <Badge variant={login.status === 'success' ? 'default' : 'destructive'} className="text-xs">
//                     {login.status === 'success' ? 'Success' : 'Blocked'}
//                   </Badge>
//                   <p className="text-xs text-muted-foreground mt-1">{login.timestamp}</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Data & Privacy */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Settings className="w-5 h-5" />
//             Data & Privacy
//           </CardTitle>
//           <CardDescription>Manage your personal data and privacy settings</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Button variant="outline" onClick={downloadData}>
//               <Download className="w-4 h-4 mr-2" />
//               Download My Data
//             </Button>
            
//             <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//               <DialogTrigger asChild>
//                 <Button variant="destructive">
//                   <Trash2 className="w-4 h-4 mr-2" />
//                   Delete Account
//                 </Button>
//               </DialogTrigger>
//               <DialogContent>
//                 <DialogHeader>
//                   <DialogTitle className="flex items-center gap-2">
//                     <AlertTriangle className="w-5 h-5 text-red-600" />
//                     Delete Account
//                   </DialogTitle>
//                   <DialogDescription>
//                     This action cannot be undone. This will permanently delete your account and remove your data from our servers.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <Alert className="border-red-200 bg-red-50">
//                   <AlertTriangle className="h-4 w-4 text-red-600" />
//                   <AlertDescription className="text-red-800">
//                     <strong>Warning:</strong> Deleting your account will:
//                     <ul className="list-disc list-inside mt-2 space-y-1">
//                       <li>Permanently delete all your orders and history</li>
//                       <li>Remove all saved items and preferences</li>
//                       <li>Cancel any active subscriptions</li>
//                       <li>Delete all personal information</li>
//                     </ul>
//                   </AlertDescription>
//                 </Alert>
//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
//                     Cancel
//                   </Button>
//                   <Button variant="destructive" onClick={deleteAccount}>
//                     Yes, Delete My Account
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           </div>
          
//           <div className="text-sm text-muted-foreground">
//             <p>Account created: {securityInfo.accountCreated}</p>
//             <p>Last security review: {securityInfo.lastSecurityReview}</p>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ProfileSecurityPage;