import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
  Settings
} from 'lucide-react';
import PartnershipReminder from './PartnershipReminder';

interface ReferralData {
  id: string;
  businessName: string;
  email: string;
  referralDate: string;
  stripeAction: 'account_created' | 'terminal_ordered' | 'setup_completed';
  terminalType?: string;
  estimatedRevenue?: number;
  status: 'pending' | 'converted' | 'active';
}

export default function ReferralTracking() {
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    conversionRate: 0,
    estimatedRevenue: 0,
    lastMonthGrowth: 0
  });

  useEffect(() => {
    // Load referral data from localStorage for persistence
    const savedReferrals = localStorage.getItem('stripe_referrals');
    if (savedReferrals) {
      const parsed = JSON.parse(savedReferrals);
      setReferrals(parsed);
      calculateStats(parsed);
    }
  }, []);

  const calculateStats = (referralData: ReferralData[]) => {
    const total = referralData.length;
    const converted = referralData.filter(r => r.status === 'converted' || r.status === 'active').length;
    const rate = total > 0 ? (converted / total) * 100 : 0;
    const revenue = referralData.reduce((sum, r) => sum + (r.estimatedRevenue || 0), 0);

    // Calculate last month growth (simulated for demo)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const recentReferrals = referralData.filter(r =>
      new Date(r.referralDate) > lastMonth
    ).length;
    const growth = total > 0 ? (recentReferrals / total) * 100 : 0;

    setStats({
      totalReferrals: total,
      conversionRate: rate,
      estimatedRevenue: revenue,
      lastMonthGrowth: growth
    });
  };

  const trackReferral = (businessName: string, email: string, action: string) => {
    const newReferral: ReferralData = {
      id: Date.now().toString(),
      businessName,
      email,
      referralDate: new Date().toISOString(),
      stripeAction: action as any,
      status: 'pending',
      estimatedRevenue: action === 'terminal_ordered' ? 59 : 0
    };

    const updatedReferrals = [...referrals, newReferral];
    setReferrals(updatedReferrals);
    localStorage.setItem('stripe_referrals', JSON.stringify(updatedReferrals));
    calculateStats(updatedReferrals);
  };

  const exportReferralData = () => {
    const csvContent = [
      'Business Name,Email,Referral Date,Action,Status,Revenue',
      ...referrals.map(r =>
        `${r.businessName},${r.email},${r.referralDate},${r.stripeAction},${r.status},${r.estimatedRevenue || 0}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stripe-referrals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Stripe Partnership Tracking</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowReminders(!showReminders)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {showReminders ? 'Hide' : 'Show'} Reminders
          </Button>
          <Button onClick={exportReferralData} variant="outline">
            Export Data
          </Button>
        </div>
      </div>

      {/* Partnership Reminders */}
      {showReminders && (
        <div className="space-y-4">
          <PartnershipReminder />
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Est. Revenue</p>
                <p className="text-2xl font-bold">${stats.estimatedRevenue}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Growth</p>
                <p className="text-2xl font-bold">+{stats.lastMonthGrowth.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Stripe Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No referrals tracked yet</p>
              <p className="text-sm">Referrals will automatically appear when users click Stripe setup links</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.slice(-10).reverse().map((referral) => (
                <div key={referral.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border rounded-lg gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{referral.businessName}</p>
                      <p className="text-sm text-gray-600">{referral.email}</p>
                    </div>
                    <Badge variant={
                      referral.status === 'active' ? 'default' :
                        referral.status === 'converted' ? 'secondary' : 'outline'
                    }>
                      {referral.stripeAction.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(referral.referralDate).toLocaleDateString()}
                    </p>
                    {referral.estimatedRevenue && (
                      <p className="text-sm font-medium text-green-600">
                        +${referral.estimatedRevenue}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partnership Progress */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Stripe Partnership Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Referral Tracking System</span>
              <Badge className="bg-green-100 text-green-800">Complete</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Partner Application</span>
              <Badge variant="outline">Pending</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Stripe Certifications</span>
              <Badge variant="outline">Not Started</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Revenue Sharing Agreement</span>
              <Badge variant="outline">Future</Badge>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => window.open('https://stripe.com/partners/become-a-partner', '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Apply for Stripe Partnership
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Tracking Button */}
      <Card>
        <CardHeader>
          <CardTitle>Test Referral Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => trackReferral(
              'Demo Business ' + Math.floor(Math.random() * 1000),
              'demo@example.com',
              'account_created'
            )}
            variant="outline"
          >
            Add Test Referral
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}