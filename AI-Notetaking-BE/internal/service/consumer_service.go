package service

import (
	"ai-notetaking-be/internal/dto"
	"context"
	"encoding/json"
	"fmt"

	"github.com/ThreeDotsLabs/watermill/message"
	"github.com/ThreeDotsLabs/watermill/pubsub/gochannel"
	"github.com/gofiber/fiber/v2/log"
)

type IConsumerService interface {
	Consume(ctx context.Context) error
}

type ConsumerService struct {
	pubSub    *gochannel.GoChannel
	topicName string
}

func (cs *ConsumerService) Consume(ctx context.Context) error {
	message, err := cs.pubSub.Subscribe(ctx, cs.topicName)
	if err != nil {
		return err
	}

	go func() {
		for msg := range message {
			cs.processMessage(ctx, msg)
		}
	}()
	return nil
}

func (cs *ConsumerService) processMessage(ctx context.Context, msg *message.Message) {
	defer msg.Nack()
	defer func(){
		if e := recover(); e != nil {
			log.Error(e)
		}
	}()

	var payload dto.PublishEmbedNoteMessage
	err := json.Unmarshal(msg.Payload, &payload)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Consumed message: %+v\n", payload.NoteId)
	msg.Ack()
}
func NewConsumerService(pubSub *gochannel.GoChannel, topicName string) IConsumerService {
	return &ConsumerService{
		pubSub:    pubSub,
		topicName: topicName,
	}
}
