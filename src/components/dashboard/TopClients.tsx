
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface Client {
  name: string;
  projects: number;
  revenue: number;
  satisfaction: number;
}

interface TopClientsProps {
  clients: Client[];
  formatCurrency: (amount: number) => string;
}

const TopClients: React.FC<TopClientsProps> = ({ clients, formatCurrency }) => {
  return (
    <Card className="glass-morphism border-white/20">
      <CardHeader>
        <CardTitle className="text-white">Top Clients</CardTitle>
        <CardDescription className="text-purple-200">
          Clients par chiffre d'affaires
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client, index) => (
            <div key={client.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="text-white font-medium">{client.name}</div>
                  <div className="text-purple-300 text-sm">
                    {client.projects} projets • Satisfaction: {client.satisfaction}%
                  </div>
                </div>
              </div>
              <div className="text-green-400 font-bold">
                {formatCurrency(client.revenue)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopClients;
