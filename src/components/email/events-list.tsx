import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OpenEvent {
  _id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  isGmailProxy: boolean;
  isUnique: boolean;
}

interface ClickEvent {
  _id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  destinationUrl: string;
  isUnique: boolean;
}

interface BounceEvent {
  _id: string;
  timestamp: string;
  recipientEmail: string;
  bounceType: string;
  reason: string;
}

interface EventsListProps {
  opens: OpenEvent[];
  clicks: ClickEvent[];
  bounce?: BounceEvent | null;
}

export function EventsList({ opens, clicks, bounce }: EventsListProps) {
  return (
    <div className="space-y-6">
      {bounce && (
        <Card>
          <CardHeader>
            <CardTitle>Bounce Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="grid gap-2">
                <div>
                  <span className="text-sm font-semibold text-red-800">
                    Type:
                  </span>{" "}
                  <span className="text-sm text-red-700">
                    {bounce.bounceType}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-red-800">
                    Reason:
                  </span>{" "}
                  <span className="text-sm text-red-700">{bounce.reason}</span>
                </div>
                <div>
                  <span className="text-sm font-semibold text-red-800">
                    Time:
                  </span>{" "}
                  <span className="text-sm text-red-700">
                    {new Date(bounce.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Open Events ({opens.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {opens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No opens recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {opens.map((open) => (
                <div
                  key={open._id}
                  className={`border rounded-md p-3 ${open.isUnique ? "bg-blue-50 border-blue-200" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(open.timestamp).toLocaleString()}
                      </p>
                      {open.isUnique && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          First Open
                        </span>
                      )}
                      {open.isGmailProxy && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-1">
                          Gmail Proxy
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    IP: {open.ipAddress}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {open.userAgent}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Click Events ({clicks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {clicks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No clicks recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {clicks.map((click) => (
                <div
                  key={click._id}
                  className={`border rounded-md p-3 ${click.isUnique ? "bg-green-50 border-green-200" : ""}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(click.timestamp).toLocaleString()}
                      </p>
                      {click.isUnique && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          First Click
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-medium mb-1">
                    URL: {click.destinationUrl}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    IP: {click.ipAddress}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {click.userAgent}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
