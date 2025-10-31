import { Scale } from 'lucide-react';

import { PROJECT_NAME } from '@/constants';

export function LicensePanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold mb-1">License</h3>
        <p className="text-sm text-muted-foreground mb-4">
          This software is dual-licensed under AGPLv3 for open source use and requires a commercial
          license for commercial applications.
        </p>
      </div>

      <div className="space-y-4">
        {}
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1">
                  GNU Affero General Public License v3.0 (AGPLv3)
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Free to use, modify, and distribute under the terms of the AGPLv3 license. This
                  license requires that any modified versions used over a network must make their
                  source code available.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://www.gnu.org/licenses/agpl-3.0.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Read Full License →
                  </a>
                </div>
              </div>
            </div>

            <div className="pl-8 space-y-2">
              <div className="text-xs space-y-1">
                <p className="font-medium text-foreground">You are free to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                  <li>Use the software for any purpose</li>
                  <li>Study and modify the source code</li>
                  <li>Distribute copies of the software</li>
                  <li>Distribute modified versions</li>
                </ul>
              </div>
              <div className="text-xs space-y-1">
                <p className="font-medium text-foreground">Under these conditions:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                  <li>Disclose the source code</li>
                  <li>Include the original license and copyright notice</li>
                  <li>State significant changes made to the software</li>
                  <li>Use the same license (AGPLv3) for modified versions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Scale className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold mb-1 text-primary">
                  Commercial License Required
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  If you want to use this software for commercial purposes without complying with
                  the AGPLv3 requirements, you need a separate commercial license.
                </p>
              </div>
            </div>

            <div className="pl-8 space-y-2">
              <div className="text-xs space-y-1">
                <p className="font-medium text-foreground">Commercial use includes:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5 ml-2">
                  <li>Providing services or SaaS based on this software</li>
                  <li>Embedding it in a paid product</li>
                  <li>Using it in a for-profit organization</li>
                </ul>
              </div>
              <div className="text-xs space-y-1 pt-2">
                <p className="font-medium text-foreground">Contact for commercial license:</p>
                <div className="text-muted-foreground space-y-0.5 ml-2">
                  <p>
                    GitHub:{' '}
                    <a
                      href="https://github.com/patrick-mns"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      @patrick-mns
                    </a>
                  </p>
                  <p>
                    E-mail:{' '}
                    <a
                      href="mailto:patrick-mns@hotmail.com"
                      className="text-primary hover:underline"
                    >
                      patrick@nografo.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground text-center">
          © 2025 {PROJECT_NAME}
        </div>
      </div>
    </div>
  );
}
