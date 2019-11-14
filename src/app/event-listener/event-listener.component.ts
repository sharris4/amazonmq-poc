import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { RxStompState } from '@stomp/rx-stomp';
import { Message } from '@stomp/stompjs';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventMessage } from '../models/event-message.model';

@Component({
  selector: 'app-event-listener',
  templateUrl: './event-listener.component.html',
  styleUrls: ['./event-listener.component.scss']
})
export class EventListenerComponent implements OnInit, OnDestroy {

  stompMessages: Array<EventMessage> = [];
  isSubscribed: boolean;
  triageNotes = '';
  connectionStatus$: Observable<string>;
  private topicSubscription: Subscription;

  constructor(private rxStompService: RxStompService, private httpService: HttpClient) {
    rxStompService.connectionState$.subscribe(() => {
      this.connectionStatus$ = rxStompService.connectionState$.pipe(map(state => RxStompState[state]));
    });
  }

  onTriageNoteChange(newNote: string): void {
    if (this.triageNotes !== newNote) {
      this.triageNotes = newNote;
      this.updateEntity();
    }
  }

  updateEntity(): void {
    // tslint:disable-next-line:one-variable-per-declaration
    const message = new EventMessage();
    message.Sender = 'MBURKE@ADMIN|PVBMPRL0587|20453913-AFD4-405C-B9EC-DE159A89E6DF';
    message.ActionType = 'Update';
    message.ChangedEntity = 'ChartEntity';
    message.ChangedData = { TriageNotes: this.triageNotes };
    message.ChangedOn = JSON.stringify(Date);
    message.Environment = 'DevTest';
    message.PrimaryKeys = {
      ChartPk: '3a43c022-6ef6-e911-80c6-0050568210b7'
    };
    this.onSendMessage(message);
    console.log(JSON.stringify(message));
  }

  onSendMessage(newEntity: EventMessage): void {
    // const message = `Message generated at ${new Date}`;
    this.rxStompService.publish({
      destination: '/topic/EMR.HIQO.TEST',
      body: JSON.stringify(newEntity),
      headers: {
        chart: '3a43c022-6ef6-e911-80c6-0050568210b7',
        Sender: 'SAM@ADMIN|PVBMPRL0587|20453913-AFD4-405C-B9EC-DE159A89E6DF',
        ChangedEntity: 'ChartEntity'
      }
    });
  }

  unsubscribe(): void {
    this.topicSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.topicSubscription = this.rxStompService
      // topic to listen on
      .watch('/topic/EMR.HIQO.TEST', {
        selector:

          // selector: "chart = '%chartPk%' AND Sender<> '%userName%|%computerName%|%chartLockPk%'
          'chart =\'3a43c022-6ef6-e911-80c6-0050568210b7\'AND Sender<>\'SAM@ADMIN|PVBMPRL0587|20453913-AFD4-405C-B9EC-DE159A89E6DF\'',

        // header - subscription name: "%userName%|%computerName%|%chartLockPk%_chart_%chartPk%"
        'activemq.subscriptionName': 'SAM@ADMIN|PVBMPRL0587|20453913-AFD4-405C-B9EC-DE159A89E6DF_chart_3a43c022-6ef6-e911-80c6-0050568210b7'

      })
      .subscribe((message: Message) => {
        const eventMessage = JSON.parse(message.body) as EventMessage;
        this.stompMessages.push(eventMessage);

        if (eventMessage.ChangedData !== null && eventMessage.ChangedData.TriageNotes !== undefined) {
          this.triageNotes = eventMessage.ChangedData.TriageNotes;
        }
      });
  }

  ngOnDestroy(): void {
    this.topicSubscription.unsubscribe();
  }
}
