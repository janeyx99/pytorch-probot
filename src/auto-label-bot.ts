import * as probot from 'probot';

function myBot(app: probot.Application): void {
  app.on('issues.labeled', async context => {
    // Careful!  For most labels, we only apply actions *when the issue
    // is added*; not if the issue is pre-existing (for example, high
    // priority label results in triage review, but if we unlabel it
    // from triage review, we shouldn't readd triage review the next
    // time the issue is labeled).

    const label = context.payload['label']['name'];
    const labels = context.payload['issue']['labels'].map(e => e['name']);
    context.log({label, labels});

    const labelSet = new Set(labels);

    const newLabels = [];
    function addLabel(l: string): void {
      if (!labelSet.has(l)) {
        newLabels.push(l);
        labelSet.add(l);
      }
    }

    // NB: Added labels here will trigger more issues.labeled actions,
    // so be careful about accidentally adding a cycle.  With just label
    // addition it's not possible to infinite loop as you will
    // eventually quiesce, beware if you remove labels though!
    switch (label) {
      case 'high priority':
      case 'critical':
        addLabel('triage review');
        break;
      case 'module: flaky-tests':
        addLabel('high priority');
        addLabel('triage review');
        break;
    }

    if (newLabels.length) {
      await context.github.issues.addLabels(context.issue({labels: newLabels}));
    }
  });
}

export default myBot;
