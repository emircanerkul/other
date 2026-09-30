<?php

namespace App\Controller\Admin;

use App\Entity\RepositoryEntity;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;
use EasyCorp\Bundle\EasyAdminBundle\Field\DateTimeField;
use EasyCorp\Bundle\EasyAdminBundle\Field\NumberField;
use EasyCorp\Bundle\EasyAdminBundle\Field\TextField;

class RepositoryEntityCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return RepositoryEntity::class;
    }

    public function configureFields(string $pageName): iterable
    {
        yield TextField::new('owner');
        yield TextField::new('repository');
        yield TextField::new('version');
        yield NumberField::new('scanCount')->hideWhenCreating();
        yield DateTimeField::new('lastScan')->hideWhenCreating();
        yield DateTimeField::new('created')->hideWhenCreating();
    }
}
