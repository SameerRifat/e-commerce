'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User, Mail, Phone, MapPin, Edit, Save, X, Eye, EyeOff, 
  Shield, Crown, CheckCircle, Info, Lock
} from 'lucide-react';

const ProfilePage = () => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // User data state
  const [userData, setUserData] = useState({
    name: "Alex John",
    email: "alexjohn@gmail.com",
    phone: "+92 300 1234567",
    location: "Islamabad, Pakistan",
    membershipTier: "Gold Member",
    joinDate: "January 2023"
  });

  const [editedData, setEditedData] = useState({ ...userData });

  // Security state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: ''
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    securityAlerts: true,
    marketingEmails: false
  });

  const handleSaveProfile = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setUserData({ ...editedData });
      setIsEditingProfile(false);
      setIsLoading(false);
    }, 1000);
  };

  const handleCancelEdit = () => {
    setEditedData({ ...userData });
    setIsEditingProfile(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setIsEditingPassword(false);
      setIsLoading(false);
      alert('Password updated successfully');
    }, 1500);
  };

  const handleNotificationToggle = (setting) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {userData.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{userData.name}</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {userData.email}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                <Crown className="w-3 h-3 mr-1" />
                {userData.membershipTier}
              </Badge>
            </div>
          </div>
        </div>
        
        {!isEditingProfile && (
          <Button 
            variant="outline" 
            className="sm:ml-auto"
            onClick={() => setIsEditingProfile(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal details and contact information</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditingProfile ? (
            <>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editedData.name}
                    onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editedData.email}
                    onChange={(e) => setEditedData({...editedData, email: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={editedData.phone}
                    onChange={(e) => setEditedData({...editedData, phone: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editedData.location}
                    onChange={(e) => setEditedData({...editedData, location: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{userData.name}</p>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{userData.email}</p>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{userData.phone}</p>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{userData.location}</p>
                  <p className="text-sm text-muted-foreground">Location</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your password and account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Security Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Lock className="w-4 h-4 text-green-600" />
              </div>
              <p className="font-medium text-sm">Password Protected</p>
              <p className="text-xs text-muted-foreground">Secure login</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mail className="w-4 h-4 text-green-600" />
              </div>
              <p className="font-medium text-sm">Email Verified</p>
              <p className="text-xs text-muted-foreground">Confirmed</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="font-medium text-sm">Account Active</p>
              <p className="text-xs text-muted-foreground">Good standing</p>
            </div>
          </div>

          {/* Password Change */}
          {!isEditingPassword ? (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">Last changed: 3 months ago</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingPassword(true)}
              >
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4 border rounded-lg">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use a strong password with at least 8 characters.
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
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsEditingPassword(false);
                    setPasswordForm({ currentPassword: '', newPassword: '' });
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Member since:</span>
            <span>{userData.joinDate}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account status:</span>
            <span className="text-green-600 font-medium">Active</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last updated:</span>
            <span>August 18, 2024</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

// // app/(main)/profile/page.js
// 'use client';

// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Progress } from '@/components/ui/progress';
// import {
//   User,
//   Mail,
//   Phone,
//   Calendar,
//   MapPin,
//   Crown,
//   Gift,
//   TrendingUp,
//   Heart,
//   Package,
//   Star,
//   Award,
//   Edit,
//   ShoppingBag,
//   Eye
// } from 'lucide-react';
// import Link from 'next/link';

// const ProfileOverviewPage = () => {
//   // Static user data
//   const userData = {
//     name: "Alex John",
//     email: "alexjohn@gmail.com",
//     phone: "+92 300 1234567",
//     joinDate: "January 2023",
//     location: "Islamabad, Pakistan",
//     membershipTier: "Gold Member",
//     totalOrders: 24,
//     totalSpent: 45600,
//     savedItems: 12,
//     rewardPoints: 2840
//   };

//   const recentOrders = [
//     {
//       id: "ORD-001",
//       date: "2024-08-15",
//       items: ["Sultan E Ameer", "Black & Silver Oud"],
//       total: 4500,
//       status: "Delivered",
//       statusColor: "bg-green-100 text-green-800"
//     },
//     {
//       id: "ORD-002", 
//       date: "2024-08-08",
//       items: ["Engraved Concentrated Perfume"],
//       total: 2500,
//       status: "Processing",
//       statusColor: "bg-orange-100 text-orange-800"
//     },
//     {
//       id: "ORD-003",
//       date: "2024-07-28",
//       items: ["White Oudh Arabic Premium"],
//       total: 3000,
//       status: "Delivered",
//       statusColor: "bg-green-100 text-green-800"
//     }
//   ];

//   const favoriteCategories = [
//     { name: "Arabic Attars", count: 8, percentage: 45 },
//     { name: "Premium Perfumes", count: 6, percentage: 35 },
//     { name: "Concentrated Oils", count: 4, percentage: 20 }
//   ];

//   const achievements = [
//     { 
//       title: "Fragrance Enthusiast", 
//       description: "Purchased 20+ fragrances",
//       icon: Award,
//       earned: true
//     },
//     {
//       title: "Loyal Customer",
//       description: "Member for over 1 year", 
//       icon: Crown,
//       earned: true
//     },
//     {
//       title: "Review Master",
//       description: "Left 15+ product reviews",
//       icon: Star,
//       earned: false
//     }
//   ];

//   return (
//     <div className="p-6 space-y-6">
//       {/* Profile Header */}
//       <div className="flex flex-col sm:flex-row gap-6">
//         <div className="flex items-center gap-4">
//           <Avatar className="w-20 h-20">
//             <AvatarFallback className="text-xl bg-primary text-primary-foreground">
//               {userData.name.split(' ').map(n => n[0]).join('')}
//             </AvatarFallback>
//           </Avatar>
//           <div>
//             <h2 className="text-2xl font-bold text-foreground">{userData.name}</h2>
//             <p className="text-muted-foreground flex items-center gap-2">
//               <Mail className="w-4 h-4" />
//               {userData.email}
//             </p>
//             <div className="flex items-center gap-2 mt-1">
//               <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
//                 <Crown className="w-3 h-3 mr-1" />
//                 {userData.membershipTier}
//               </Badge>
//             </div>
//           </div>
//         </div>
//         <Button variant="outline" className="sm:ml-auto">
//           <Edit className="w-4 h-4 mr-2" />
//           Edit Profile
//         </Button>
//       </div>

//       {/* Quick Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-primary/10 rounded-lg">
//                 <Package className="w-5 h-5 text-primary" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{userData.totalOrders}</p>
//                 <p className="text-sm text-muted-foreground">Total Orders</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-green-100 rounded-lg">
//                 <TrendingUp className="w-5 h-5 text-green-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">Rs.{userData.totalSpent.toLocaleString()}</p>
//                 <p className="text-sm text-muted-foreground">Total Spent</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-red-100 rounded-lg">
//                 <Heart className="w-5 h-5 text-red-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{userData.savedItems}</p>
//                 <p className="text-sm text-muted-foreground">Saved Items</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>

//         <Card>
//           <CardContent className="p-4">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-orange-100 rounded-lg">
//                 <Gift className="w-5 h-5 text-orange-600" />
//               </div>
//               <div>
//                 <p className="text-2xl font-bold">{userData.rewardPoints}</p>
//                 <p className="text-sm text-muted-foreground">Reward Points</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Recent Orders */}
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between">
//             <div>
//               <CardTitle>Recent Orders</CardTitle>
//               <CardDescription>Your latest purchases</CardDescription>
//             </div>
//             <Button variant="outline" size="sm" asChild>
//               <Link href="/profile/orders">
//                 <Eye className="w-4 h-4 mr-2" />
//                 View All
//               </Link>
//             </Button>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {recentOrders.map((order) => (
//               <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-1">
//                     <p className="font-medium">{order.id}</p>
//                     <Badge className={`text-xs ${order.statusColor}`}>
//                       {order.status}
//                     </Badge>
//                   </div>
//                   <p className="text-sm text-muted-foreground">
//                     {order.items.join(', ')}
//                   </p>
//                   <p className="text-xs text-muted-foreground">{order.date}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-medium">Rs.{order.total.toLocaleString()}</p>
//                 </div>
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         {/* Account Information */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Account Information</CardTitle>
//             <CardDescription>Your personal details</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="flex items-center gap-3">
//               <User className="w-4 h-4 text-muted-foreground" />
//               <div>
//                 <p className="font-medium">{userData.name}</p>
//                 <p className="text-sm text-muted-foreground">Full Name</p>
//               </div>
//             </div>
            
//             <div className="flex items-center gap-3">
//               <Phone className="w-4 h-4 text-muted-foreground" />
//               <div>
//                 <p className="font-medium">{userData.phone}</p>
//                 <p className="text-sm text-muted-foreground">Phone Number</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <MapPin className="w-4 h-4 text-muted-foreground" />
//               <div>
//                 <p className="font-medium">{userData.location}</p>
//                 <p className="text-sm text-muted-foreground">Location</p>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <Calendar className="w-4 h-4 text-muted-foreground" />
//               <div>
//                 <p className="font-medium">{userData.joinDate}</p>
//                 <p className="text-sm text-muted-foreground">Member Since</p>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Favorite Categories */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Shopping Preferences</CardTitle>
//             <CardDescription>Your favorite fragrance categories</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {favoriteCategories.map((category) => (
//               <div key={category.name} className="space-y-2">
//                 <div className="flex justify-between text-sm">
//                   <span>{category.name}</span>
//                   <span className="text-muted-foreground">{category.count} items</span>
//                 </div>
//                 <Progress value={category.percentage} className="h-2" />
//               </div>
//             ))}
//           </CardContent>
//         </Card>

//         {/* Achievements */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Achievements</CardTitle>
//             <CardDescription>Your shopping milestones</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {achievements.map((achievement) => {
//               const Icon = achievement.icon;
//               return (
//                 <div key={achievement.title} className={`flex items-center gap-3 p-3 rounded-lg border ${achievement.earned ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
//                   <div className={`p-2 rounded-lg ${achievement.earned ? 'bg-primary/10' : 'bg-muted'}`}>
//                     <Icon className={`w-4 h-4 ${achievement.earned ? 'text-primary' : 'text-muted-foreground'}`} />
//                   </div>
//                   <div className="flex-1">
//                     <p className={`font-medium ${!achievement.earned && 'text-muted-foreground'}`}>
//                       {achievement.title}
//                     </p>
//                     <p className="text-sm text-muted-foreground">
//                       {achievement.description}
//                     </p>
//                   </div>
//                   {achievement.earned && (
//                     <Badge variant="secondary" className="bg-primary/10 text-primary">
//                       Earned
//                     </Badge>
//                   )}
//                 </div>
//               );
//             })}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default ProfileOverviewPage;