import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

export function OpenClawQueue() {
  const { data: queue, isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/sentinel/openclaw-queue'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OpenClaw Comms Queue</CardTitle>
          <CardDescription>Loading message queue...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OpenClaw Comms Queue</CardTitle>
          <CardDescription className="text-destructive">Failed to load message queue</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communications Queue (OpenClaw Bridge)</CardTitle>
        <CardDescription>
          Live view of tasks Sentinel is passing to OpenClaw via the database bridge.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(!queue || queue.length === 0) ? (
          <div className="text-center py-6 text-muted-foreground">
            No messages in the queue.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="w-1/2">Message</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((msg: any) => (
                  <TableRow key={msg.id}>
                    <TableCell className="whitespace-nowrap">
                      {msg.createdAt ? format(new Date(msg.createdAt), "MMM d, h:mm a") : 'Unknown'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{msg.agentId}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={msg.message}>
                      {msg.message}
                    </TableCell>
                    <TableCell>
                      <Badge variant={msg.priority === 'high' || msg.priority === 'urgent' ? 'destructive' : 'secondary'}>
                        {msg.priority || 'normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        msg.status === 'completed' ? 'default' :
                        msg.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {msg.status || 'pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
