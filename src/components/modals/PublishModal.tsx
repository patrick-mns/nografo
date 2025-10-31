import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, Edit } from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPublishing: boolean;
  onPublish: (
    name: string,
    description: string,
    isPublic: boolean,
    graphId?: string
  ) => Promise<void>;
  existingGraph?: {
    id: string;
    name: string;
    description: string;
    is_public: boolean;
  } | null;
}

const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onPublish,
  isPublishing = false,
  existingGraph = null,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const isEditing = !!existingGraph;

  useEffect(() => {
    if (existingGraph) {
      setName(existingGraph.name);
      setDescription(existingGraph.description);
      setIsPublic(existingGraph.is_public);
    } else {
      setName('');
      setDescription('');
      setIsPublic(false);
    }
  }, [existingGraph, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      await onPublish(name.trim(), description.trim(), isPublic, existingGraph?.id);
      if (!isEditing) {
        setName('');
        setDescription('');
        setIsPublic(false);
      }
      onClose();
    } catch (error) {
      console.error('Error publishing graph:', error);
    }
  };

  const handleClose = () => {
    if (!isPublishing) {
      if (!isEditing) {
        setName('');
        setDescription('');
        setIsPublic(false);
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit className="h-5 w-5" />
                Edit Published Graph
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Publish Graph
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the information for your published graph.'
              : 'Save your graph to the cloud and optionally make it public for others to view.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="publish-name">Name *</Label>
            <Input
              id="publish-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your graph"
              disabled={isPublishing}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publish-description">Description</Label>
            <Textarea
              id="publish-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of your graph"
              disabled={isPublishing}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="public-switch"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={isPublishing}
            />
            <Label htmlFor="public-switch" className="text-sm">
              Make this graph public
            </Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPublishing}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Publishing...'}
                </>
              ) : (
                <>
                  {isEditing ? (
                    <>
                      <Edit className="mr-2 h-4 w-4" />
                      Update
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Publish
                    </>
                  )}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PublishModal;
