import logoSvg from '/logo.svg';
import { APP_NAME, PROJECT_NAME, GITHUB_REPO } from '@/constants';

export function AboutPanel() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <img src={logoSvg} alt={`${APP_NAME} Logo`} className="w-12 h-12" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {APP_NAME} is a graph-based context engine that leverages language models to provide
          intelligent and relevant answers based on structured data. It is formulated based on the
          latest research, particularly:{' '}
          <a
            href="https://zenodo.org/records/17330235"
            className="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://zenodo.org/records/17330235
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border border-border">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium">0.0.1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Author</span>
              <span className="flex items-center gap-2">
                <a
                  href="https://github.com/patrick-mns"
                  className="text-sm font-medium text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @patrick-mns
                </a>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Repository</span>
              <a
                href={GITHUB_REPO}
                className="text-sm font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">License</span>
              <span className="text-sm font-medium">AGPLv3 / Commercial</span>
            </div>
          </div>
        </div>

        {}
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <h4 className="text-sm font-semibold mb-2">License</h4>
          <p className="text-xs text-muted-foreground mb-3">
            This software is dual-licensed under the GNU Affero General Public License v3.0 (AGPLv3)
            for open source use, and a commercial license for proprietary applications.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View AGPLv3 License →
            </a>
            <span className="text-xs text-muted-foreground">•</span>
            <a
              href="https://github.com/patrick-mns"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Contact for Commercial License
            </a>
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
