import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FiFileText, FiDownload } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { Loader2, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
}

interface DriveFilePickerProps {
  onFileImported: (bookId: string) => void;
}

export default function DriveFilePicker({ onFileImported }: DriveFilePickerProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  // Fetch Google Drive documents
  const { 
    data: documents = [], 
    isLoading: isLoadingDocuments,
    error: documentsError
  } = useQuery<DriveFile[]>({ 
    queryKey: ['/api/drive/documents'],
    enabled: !!user?.google_access_token,
    retry: false
  });
  
  // Import file mutation
  const importMutation = useMutation({
    mutationFn: async (file: DriveFile) => {
      return apiRequest('POST', '/api/drive/import', {
        fileId: file.id,
        fileName: file.name
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "File imported successfully",
        description: `"${data.title}" has been imported from Google Drive.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      if (onFileImported) {
        onFileImported(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: "Error importing file from Google Drive. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleImportFile = (file: DriveFile) => {
    importMutation.mutate(file);
  };
  
  const handleLoginWithGoogle = () => {
    window.location.href = "/auth/google";
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <span>Loading...</span>
      </div>
    );
  }
  
  if (!user || !user.google_access_token) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <FcGoogle className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Connect to Google Drive</h3>
          <p className="text-muted-foreground mb-4">
            Sign in with your Google account to access your documents from Google Drive.
          </p>
          <Button onClick={handleLoginWithGoogle} className="gap-2">
            <FcGoogle className="h-4 w-4" />
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoadingDocuments) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
        <span>Loading documents from Google Drive...</span>
      </div>
    );
  }
  
  if (documentsError) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-medium mb-2">Error Loading Documents</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading your documents from Google Drive.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Filter for PDFs and text files
  const pdfFiles = documents.filter((doc: DriveFile) => doc.mimeType === 'application/pdf');
  const textFiles = documents.filter((doc: DriveFile) => doc.mimeType === 'text/plain');
  
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <Tabs defaultValue="pdf">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="pdf" className="gap-2">
                <FiFileText /> PDF Files ({pdfFiles.length})
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
                <FiFileText /> Text Files ({textFiles.length})
              </TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              Signed in as {user.display_name}
            </div>
          </div>
          
          <TabsContent value="pdf" className="mt-2">
            <FileTable 
              files={pdfFiles} 
              onImport={handleImportFile} 
              isImporting={importMutation.isPending} 
            />
          </TabsContent>
          
          <TabsContent value="text" className="mt-2">
            <FileTable 
              files={textFiles} 
              onImport={handleImportFile} 
              isImporting={importMutation.isPending} 
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface FileTableProps {
  files: DriveFile[];
  onImport: (file: DriveFile) => void;
  isImporting: boolean;
}

function FileTable({ files, onImport, isImporting }: FileTableProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files found. Upload files to your Google Drive to see them here.
      </div>
    );
  }
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Modified</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium flex items-center gap-2">
                <FiFileText className="text-primary" />
                {file.name}
              </TableCell>
              <TableCell>
                {format(new Date(file.modifiedTime), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onImport(file)}
                  disabled={isImporting}
                  className="gap-1"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FiDownload className="h-4 w-4" />
                  )}
                  Import
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}