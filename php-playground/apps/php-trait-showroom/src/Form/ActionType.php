<?php

namespace App\Form;

use App\Entity\RepositoryEntity;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

class ActionType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('field_repository', EntityType::class, [
                'class' => RepositoryEntity::class,
                'attr' => ['class'=>'form-control']
            ])
            ->add('field_submit_run_repository_explorer_all', SubmitType::class, [
                'label' => 'Run Repository Explorer for All',
                'attr' => [
                        'class' => 'form-control btn'
                    ]
                ])
            ->add('field_submit_run_repository_explorer_selected', SubmitType::class, [
                'label' => 'Run Repository Explorer for Selected',
                'attr' => [
                    'class' => 'form-control btn',
                    'style' => 'height: 33px;'
                ]
            ]);
    }

    public function configureOptions(OptionsResolver $resolver): void
    {
        $resolver->setDefaults([
            // Configure your form options here
        ]);
    }
}
