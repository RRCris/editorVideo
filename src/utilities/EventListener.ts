import { Subject } from "rxjs";

export default class {
  subject = new Subject<string>();

  on(event: string, callback: () => void) {
    return this.subject.subscribe((eventEmitted) => {
      if (eventEmitted == event) {
        callback();
      }
    });
  }

  fire(event: string) {
    this.subject.next(event);
  }
}
